function doGet(e) {
  const sheet = SpreadsheetApp.openById('sheet id');
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  const data = values.map(row => ({
    name: row[0],        // 假設第一欄是名字
    time: row[1],        // 假設第二欄是時間
    activity: row[2],    // 假設第三欄是活動描述
    timestamp: row[3]    // 假設第四欄是日期
  }));

  return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
}
