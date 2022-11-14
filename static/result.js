
$('#rdbVer').text(cliData.rdbVer); $('#redisVer').text(cliData.redisVer); $('#totalKeyBytes').text(formatBytes(cliData.usedMem));
$('#ctime').text(formatTime(cliData.cTime)); $('#cluster').text(cliData.clusterName); $('#group').text(cliData.groupName);

$('#totalKeyNum').text(formatNumber(cliData.count)); buildTypeNumChart(); buildTypeByteChart(); buildExpiryNumChart(); buildExpiryByteChart();
$('#topPrefixTable').bootstrapTable({ data: cliData.largestKeyPrefix, columns: [{ field: 'Prefix', title: 'Key Prefix' }, { field: 'Type', title: 'Type' }, { field: 'Bytes', title: 'Memory Usage', sortable: true, formatter: function (val, row, index) { return formatBytes(val) } }, { field: 'Num', title: 'Keys', sortable: true, formatter: function (val, row, index) { return formatNumber(val) } }, { field: 'Elements', title: 'Elements', sortable: true, formatter: function (val, row, index) { return formatNumber(val) } }], pagination: true, pageSize: 10, pageNumber: 1, });
$('#topBigKeysTable').bootstrapTable({
    data: cliData.largestRecords, columns: [
        { field: 'Key', title: 'Key' }, { field: 'Type', title: 'Type' }, { field: 'Encoding', title: 'Encoding' },
        { field: 'Bytes', title: 'Memory Usage', sortable: true, formatter: function (val, row, index) { return formatBytes(val) } },
        { field: 'Database', title: 'Database' }, { field: 'Expiry', title: 'Validity Period', formatter: function (val, row, index) { return formatExpiry(val) } },
        { field: 'NumOfElem', title: 'Elements', sortable: true, formatter: function (val, row, index) { return formatNumber(val) } },
        { field: 'LenOfLargestElem', title: 'Length of Largest Element', sortable: true, }], pagination: true, pageSize: 10, pageNumber: 1,
});
$('#functionTable').bootstrapTable({ data: cliData.functions, columns: [{ field: 'Engine', title: 'Engine' }, { field: 'LibraryName', title: 'Library Name' }], pagination: true, pageSize: 10, pageNumber: 1, });
$('#streamsTable').bootstrapTable({ data: cliData.largestStreams, columns: [{ field: 'Key', title: 'Key' }, { field: 'Length', title: 'Length', sortable: true, }, { field: 'LastId', title: 'LastId' }, { field: 'FirstId', title: 'FirstId' }, { field: 'MaxDeletedEntryId', title: 'Max Deleted EntryId' }, { field: 'EntriesAdded', title: 'Entries Added', sortable: true, }, { field: 'CGroups', title: 'Consumer Groups', sortable: true, }], pagination: true, pageSize: 10, pageNumber: 1, }); function buildTypeNumChart() { const typeChartLabels = cliData.typeRecords.map(item => item.Type); const typeNumData = cliData.typeRecords.map(item => item.Num); buildBarChart(typeChartLabels, typeNumData, 'Keys', 'Distribution of Keys', formatNumber, 'typeNum') }; function buildTypeByteChart() { const typeChartLabels = cliData.typeRecords.map(item => item.Type); const typeByteData = cliData.typeRecords.map(item => item.Bytes); buildBarChart(typeChartLabels, typeByteData, 'Memory Usage of Keys', 'Memory Usage of Keys', formatBytes, 'typeByte') }; function buildExpiryNumChart() { const expiryLabels = cliData.expiryInfo.map(item => item.Expiry); const expiryData = cliData.expiryInfo.map(item => item.Num); buildBarChart(expiryLabels, expiryData, 'Total Keys', 'Distribution of Key Expiration Time (Quantity)', formatNumber, 'expiryNum') }; function buildExpiryByteChart() { const expiryLabels = cliData.expiryInfo.map(item => item.Expiry); const expiryData = cliData.expiryInfo.map(item => item.Bytes); buildBarChart(expiryLabels, expiryData, 'Memory Usage of Keys', 'Distribution of Key Expiration Time (Memory)', formatBytes, 'expiryByte') }; function buildBarChart(labels, dsData, dsLabel, title, formaterFunc, eleId) { const data = { labels: labels, datasets: [{ data: dsData, label: dsLabel, minBarLength: 5, }] }; const config = { type: 'bar', data: data, options: { responsive: true, plugins: { legend: { display: false, }, title: { display: true, text: title } }, scales: { y: { beginAtZero: true, ticks: { callback: function (label, index, labels) { return formaterFunc(label) } } } } } }; const ctx = document.getElementById(eleId); new Chart(ctx, config) }; function formatNumber(num) { const k = 1000; const m = 1000000; const b = 1000000000; if (num < k) { return num } else if (num > k && num < m) { return (num / k).toFixed(1) + 'K' } else if (num >= m && num <= b) { return (num / m).toFixed(1) + 'M' } else { return (num / b).toFixed(1) + 'B' } }; function formatBytes(bytes) { const kb = 1024; const mb = 1024 * 1024; const gb = 1024 * 1024 * 1024; if (bytes < kb) { return bytes.toFixed(1) + 'B' } if (bytes >= kb && bytes < mb) { return (bytes / kb).toFixed(1) + 'KB' } else if (bytes >= mb && bytes <= gb) { return (bytes / mb).toFixed(1) + 'MB' } else { return (bytes / gb).toFixed(1) + 'GB' } }; function formatExpiry(time) { if (time == 0) { return 'Permanent' } else { let date = new Date(time); let year = date.getFullYear(); let month = date.getMonth() + 1; let day = date.getDate(); let hour = date.getHours(); let min = date.getMinutes(); let second = date.getSeconds(); return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + second } };


$('#longestExpiryTable').bootstrapTable(
    {
        data: cliData.longestExpirytRecords,
        columns: [
            { field: 'Key', title: 'Key' }, { field: 'Type', title: 'Type' }, { field: 'Encoding', title: 'Encoding' },
            { field: 'Expiry', title: 'Validity Period', sortable: true, formatter: function (val, row, index) { return formatExpiry(val) } },
            { field: 'Bytes', title: 'Memory Usage', sortable: true, formatter: function (val, row, index) { return formatBytes(val) } },
            { field: 'NumOfElem', title: 'Elements', sortable: true, formatter: function (val, row, index) { return formatNumber(val) } },
            { field: 'LenOfLargestElem', title: 'Length of Largest Element', sortable: true, }

        ],
        pagination: true, pageSize: 10, pageNumber: 1,
    }

)

function buildTypeNumChart() { 
    const typeChartLabels = cliData.typeRecords.map(item => item.Type); 
    const typeNumData = cliData.typeRecords.map(item => item.Num); buildBarChart(typeChartLabels, typeNumData, 'Keys', 'Distribution of Keys', formatNumber, 'typeNum') 
}; 
function buildTypeByteChart() { 
    const typeChartLabels = cliData.typeRecords.map(item => item.Type); const typeByteData = cliData.typeRecords.map(item => item.Bytes); 
    buildBarChart(typeChartLabels, typeByteData, 'Memory Usage of Keys', 'Memory Usage of Keys', formatBytes, 'typeByte') 
}; 
function buildExpiryNumChart() { 
    const expiryLabels = cliData.expiryInfo.map(item => item.Expiry); const expiryData = cliData.expiryInfo.map(item => item.Num); 
    buildBarChart(expiryLabels, expiryData, 'Total Keys', 'Distribution of Key Expiration Time (Quantity)', formatNumber, 'expiryNum') 
}; 
function buildExpiryByteChart() { 
    const expiryLabels = cliData.expiryInfo.map(item => item.Expiry); const expiryData = cliData.expiryInfo.map(item => item.Bytes); 
    buildBarChart(expiryLabels, expiryData, 'Memory Usage of Keys', 'Distribution of Key Expiration Time (Memory)', formatBytes, 'expiryByte') 
}; 
function buildBarChart(labels, dsData, dsLabel, title, formaterFunc, eleId) { 
    const data = { labels: labels, datasets: [{ data: dsData, label: dsLabel, minBarLength: 5, }] }; 
    const config = { type: 'bar', data: data, options: { responsive: true, plugins: { legend: { display: false, }, title: { display: true, text: title } }, scales: { y: { beginAtZero: true, ticks: { callback: function (label, index, labels) { return formaterFunc(label) } } } } } }; 
    const ctx = document.getElementById(eleId); new Chart(ctx, config) 
}; 
function formatNumber(num) { 
    const k = 1000; const m = 1000000; const b = 1000000000; 
    if (num < k) { return num } else if (num > k && num < m) { return (num / k).toFixed(1) + 'K' } else if (num >= m && num <= b) { return (num / m).toFixed(1) + 'M' } else { return (num / b).toFixed(1) + 'B' } 
}; 
function formatBytes(bytes) { 
    const kb = 1024; const mb = 1024 * 1024; const gb = 1024 * 1024 * 1024; 
    if (bytes < kb) { return bytes.toFixed(1) + 'B' } if (bytes >= kb && bytes < mb) { return (bytes / kb).toFixed(1) + 'KB' } else if (bytes >= mb && bytes <= gb) { return (bytes / mb).toFixed(1) + 'MB' } else { return (bytes / gb).toFixed(1) + 'GB' } 
}; 
function formatExpiry(time) { 
    if (time == 0) { return 'Permanent' } 
    else { 
        let date = new Date(time); let year = date.getFullYear(); let month = date.getMonth() + 1; 
        let day = date.getDate(); let hour = date.getHours(); let min = date.getMinutes(); let second = date.getSeconds(); 
        return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + second 
    } 
};
function formatTime(timestamp) { 
    let date = new Date(timestamp); let year = date.getFullYear(); let month = date.getMonth() + 1; 
    let day = date.getDate(); let hour = date.getHours(); let min = date.getMinutes(); let second = date.getSeconds(); 
    return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + second 
}