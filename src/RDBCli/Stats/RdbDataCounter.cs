﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RDBCli
{
    internal class RdbDataCounter
    {
        private char[] _separators = new char[] { ':', ';', ',', '_', '-', '.' };

        private PriorityQueue<Record, ulong> _largestRecords;
        private PriorityQueue<PrefixRecord, PrefixRecord> _largestKeyPrefixes;
        private PriorityQueue<Record, ulong> _expiryRecords;
        private PriorityQueue<StreamsRecord, ulong> _largestStreams;
        private Dictionary<string, TypeKeyValue> _keyPrefix;
        private Dictionary<string, CommonStatValue> _typeDict;
        private Dictionary<string, CommonStatValue> _expiryDict;
        private readonly BlockingCollection<AnalysisRecord> _records;

        private uint _zeroCount;

        public RdbDataCounter(BlockingCollection<AnalysisRecord> records, string separators = "")
        {
            this._records = records;
            this._largestRecords = new PriorityQueue<Record, ulong>();
            this._expiryRecords = new PriorityQueue<Record, ulong>();
            this._largestStreams = new PriorityQueue<StreamsRecord, ulong>();
            this._largestKeyPrefixes = new PriorityQueue<PrefixRecord, PrefixRecord>(PrefixRecord.Comparer);
            this._keyPrefix = new Dictionary<string, TypeKeyValue>();
            this._typeDict = new Dictionary<string, CommonStatValue>();
            this._expiryDict = new Dictionary<string, CommonStatValue>();
            this._zeroCount = 0;


            if (!string.IsNullOrWhiteSpace(separators))
            {
                _separators = separators.ToCharArray();
            }
        }

        public Task Count()
        {
            System.Threading.CancellationTokenSource cts = new System.Threading.CancellationTokenSource();
            var task = Task.Factory.StartNew(() => 
            {
                while (!_records.IsCompleted)
                {
                    try
                    {
                        if (_records.TryTake(out var item))
                        {   
                            if (item.Record.LenOfLargestElem==item.Record.NumOfElem) {
                                item.Record.NumOfElem = 1;
                            }
                            this.CountLargestEntries(item.Record, 500);
                            this.CounteByType(item.Record);
                            this.CountByKeyPrefix(item.Record);
                            this.CountExpiry(item.Record, 500);
                            this.CountStreams(item.StreamsRecord, 500);
                        }
                        else
                        {
                            continue;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                }

                CalcuLargestKeyPrefix(500);
                cts.Cancel();
            }, cts.Token);

            return task;
        }

        public List<PrefixRecord> GetLargestKeyPrefixes(int num = 100)
        {
            return _largestKeyPrefixes.UnorderedItems
                .OrderByDescending(x => x.Priority, PrefixRecord.Comparer)
                .Select(x=>x.Element)
                .Take(num)
                .ToList();
        }

        public List<Record> GetLargestRecords(int num = 100)
        {
            return _largestRecords.UnorderedItems
                .OrderByDescending(x => x.Priority)
                .Select(x => x.Element)
                .Take(num)
                .ToList();
        }

        public List<Record> GetLongestExpiryRecords(int num = 100) {
            var items = _expiryRecords.UnorderedItems
                .OrderByDescending(x => x.Priority)
                .Select(x => x.Element)
                .ToList();
            List<Record> res = new List<Record>();
            foreach(Record record in items) {
                if (res.Count>=num) {
                    break;
                }
                // System.Console.WriteLine(record.Expiry);
                if (record.Expiry==0 && res.Count>=num/2) {
                    continue;
                }
                record.FieldOfLargestElem = null;
                res.Add(record);
            }
            return res;
        }

        public List<TypeRecord> GetTypeRecords()
        {
            return _typeDict
                .Select(x => new TypeRecord { Type = x.Key, Num = x.Value.Num, Bytes = x.Value.Bytes })
                .ToList();
        }

        public List<ExpiryRecord> GetExpiryInfo()
        {
            return _expiryDict
               .Select(x => new ExpiryRecord { Expiry = x.Key, Num = x.Value.Num, Bytes = x.Value.Bytes })
               .OrderBy(x => x.Expiry)
               .ToList();
        }

        public List<StreamsRecord> GetStreamRecords(int num = 100)
        {
            return _largestStreams.UnorderedItems
                .OrderByDescending(x=>x.Priority)
                .Select(x => x.Element)
                .Take(num)
                .ToList();
        }

        private void CountExpiry(Record item, int num)
        {
            var key = CommonHelper.GetExpireString(item.Expiry);
            
            InitOrAddStat(this._expiryDict, key, item.Bytes);
            if (key == "Permanent" && this._zeroCount >= num/2) {
                return;
            }
            
            if (key == "Permanent") {
                _expiryRecords.Enqueue(item, ulong.MaxValue);
                ++_zeroCount;
            } else {
                _expiryRecords.Enqueue(item, (ulong)item.Expiry);
            }
            if (_expiryRecords.Count > num) {
                _ = _expiryRecords.Dequeue();
            }
        }

        private void CalcuLargestKeyPrefix(int num)
        {
            foreach (var item in _keyPrefix)
            {
                var tk = TypeKey.FromString(item.Key);
                var ent = new PrefixRecord
                {
                    Type = tk.Type,
                    Prefix = tk.Key,
                    Bytes = item.Value.Bytes,
                    Num = item.Value.Num,
                    Elements = item.Value.Elements,
                };

                _largestKeyPrefixes.Enqueue(ent, ent);
                if (_largestKeyPrefixes.Count > num)
                {
                    _ = _largestKeyPrefixes.Dequeue();
                }
            }
        }

        private void CountStreams(StreamsRecord streamsRecord, int num)
        {
            if(streamsRecord == null) return;

            _largestStreams.Enqueue(streamsRecord, streamsRecord.Length);

            if (_largestStreams.Count > num)
            {
                _ = _largestStreams.Dequeue();
            }
        }

        private void CountByKeyPrefix(Record record)
        {
            var prefixes = GetPrefixes(record.Key);

            var tKey = new TypeKey { Type = record.Type };

            foreach (var item in prefixes)
            {
                if (item.Length == 0) continue;

                tKey.Key = item;

                if (this._keyPrefix.ContainsKey(tKey.ToString()))
                {
                    this._keyPrefix[tKey.ToString()].Num++;
                    this._keyPrefix[tKey.ToString()].Bytes += record.Bytes;
                    this._keyPrefix[tKey.ToString()].Elements += record.NumOfElem;
                }
                else
                {
                    this._keyPrefix[tKey.ToString()] = new TypeKeyValue
                    {
                        Num = 1,
                        Bytes = record.Bytes,
                        Elements = record.NumOfElem
                    };
                }
            }
        }

        private List<string> GetPrefixes(string s)
        {
            var res = new List<string>();

            var span = s.AsSpan();

            var sepIdx = span.IndexOfAny(_separators);

            if (sepIdx < 0) res.Add(s);

            while (sepIdx > -1)
            {
                var str = new string(span[..(sepIdx + 1)]);

                if (res.Any())
                {
                    str = string.Concat(res[^1], str);
                }

                res.Add(str);

                span = span[(sepIdx + 1)..];
                sepIdx = span.IndexOfAny(_separators);
            }

            // for (int i = 0; i < res.Count; i++)
            // {
            //     res[i] = res[i].TrimEnd(_separators);
            // }

            return res.Distinct().ToList();
        }

        private void CountLargestEntries(Record record, int num)
        {   
            if (record.FieldOfLargestElem!=null && record.FieldOfLargestElem.Length >= 4096) {
                record.FieldOfLargestElem = record.FieldOfLargestElem.Substring(0, 4096);
            }
            _largestRecords.Enqueue(record, record.Bytes);

            if (_largestRecords.Count > num)
            {
                _ = _largestRecords.Dequeue();
            }
        }

        private void CounteByType(Record record)
        {
            InitOrAddStat(this._typeDict, record.Type, record.Bytes);
        }

        private void InitOrAddStat(Dictionary<string, CommonStatValue> dict, string key, ulong bytes)
        {
            if (dict.ContainsKey(key))
            {
                dict[key].Num++;
                dict[key].Bytes += bytes;
            }
            else
            {
                dict[key] = new CommonStatValue
                {
                    Bytes = bytes,
                    Num = 1,
                };
            }
        }
    }
}
