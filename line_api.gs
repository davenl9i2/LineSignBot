//line bot token
var CHANNEL_ACCESS_TOKEN = 'token';
//google sheet ID
var sheet = SpreadsheetApp.openById('id');
var sheetTemp = SpreadsheetApp.openById('id');

//主程式，傳送訊息
function doPost(e) {

  var msg = JSON.parse(e.postData.contents);
  console.log(msg);

  // 取出 replayToken 和發送的訊息文字
  var replyToken = msg.events[0].replyToken;
  const user_id = msg.events[0].source.userId;
  var userMessage = msg.events[0].message.text;
  var groupid = msg.events[0].source.groupId;

  if (typeof replyToken === 'undefined') {
    return;
  }

  var userName = getName(user_id,groupid);
  

  if(userMessage=="上班"){ 
    if(findDate(userName) == 'none'){
      joinTemp(userName);
      replayMsg('✔️上班成功-'+ userName+ '\n'+getTime());
    }else{
      replayMsg('❌您尚未下班-'+ userName+ '\n請先下班');
    } 
  }

  if(userMessage.charAt(0)=="下班"){
    if(findDate(userName) != 'none'){
      replayMsg('✔️下班成功-'+ userName+ '\n'+getTime() +'\n工作內容:' + userMessage.substring(1) + '\n工作時間:' + calculateTimeDifference(findDate(userName)));
      joinSheet(userName,calculateTimeDifference(findDate(userName)),userMessage.substring(1));
      delDate(userName);
    }else{
      replayMsg('❌您尚未上班'+ userName );
    }
  }

  if(userMessage=="現場工作人員"){ 
    replayMsg(showTempDate());
  }

  function replayMsg(textMsg){
    var url = 'https://api.line.me/v2/bot/message/reply';
      UrlFetchApp.fetch(url, {
         'headers': {
         'Content-Type': 'application/json; charset=UTF-8',
         'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
        },
        'method': 'post',
        'payload': JSON.stringify({
           'replyToken': replyToken,
           'messages': [{
           'type': 'text',
           'text': textMsg ,
       }],
      }),
    });

  } 

}


//取得當前時間
function getTime(){
// 取得時間
  var currentDate = new Date();

  // 格式化時間
  var dateFormat = "yyyy-MM-dd";
  var timeFormat = "HH:mm:ss";

  // 轉換
  var formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), dateFormat);
  var formattedTime = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), timeFormat);
  return formattedDate + '-' + formattedTime
}

//加入sheet
function joinSheet(userId,time,about) {
  //取得sheet
  var targetSheet = sheet.getSheets()[0];
  
  //暫存data
  var data = [
    [userId, time,about,Date()],
  ];
  var lastRow = targetSheet.getLastRow();
  
  //加入資料
  targetSheet.getRange(lastRow + 1, 1, data.length, data[0].length).setValues(data);
}

//加入暫存sheet，同上
function joinTemp(userId) {
  var targetSheet = sheetTemp.getSheets()[0];
  
  var data = [
    [userId, getTime()],
  ];
  var lastRow = targetSheet.getLastRow();
  

  targetSheet.getRange(lastRow + 1, 1, data.length, data[0].length).setValues(data);
}

//取得用戶名稱
function getName(user_id,groupid){
  //使用line api 取得 group user的url
  var nameurl = "https://api.line.me/v2/bot/group/" + groupid + "/member/" + user_id;
  try {
            //使用api取得用戶名稱
            var response = UrlFetchApp.fetch(nameurl, {
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
                    "Content-Type": "application/json"
                },
            });
            var namedata = JSON.parse(response);
            var reserve_name = namedata.displayName;
        }
        catch {
            //無用戶則顯示 not avaliable
            reserve_name = "not avaliable";
        }
        //回傳用戶名稱
        return String(reserve_name)
}

//尋找資料，回傳入場時間，如無則return
function findDate(name) {
  // 取得試算表的第一個（預設）工作表
  var targetSheet = sheetTemp.getSheets()[0];
  
  // 檢查是否有任何資料行
  var lastRow = targetSheet.getLastRow();
  if (lastRow === 0) {
    return 'none';  // 若沒有資料行，直接返回 'none'
  }

  // 取得第一欄的資料範圍（假設名稱在A欄）
  var nameColumnRange = targetSheet.getRange(1, 1, targetSheet.getLastRow(), 1);
  
  // 取得名稱欄的值
  var nameColumnValues = nameColumnRange.getValues();
  
  var foundRows = [];
  
  // 迴圈遍歷名稱欄以找到指定的名稱
  for (var i = 0; i < nameColumnValues.length; i++) {
    var rowName = nameColumnValues[i][0];
    
    if (rowName === name) {
      foundRows.push(i + 1); // 將行數加入，轉換為1-based索引
      // 取得B欄的值
      var valueInBColumn = targetSheet.getRange(i + 1, 2).getValue(); // B欄為第2欄
      return valueInBColumn //回傳時間
    }
  }
  
  return 'none' //無則回傳none
}

//刪除資料
function delDate(name) {
  // 取得試算表的第一個（預設）工作表
  var targetSheet = sheetTemp.getSheets()[0];
  
  // 取得第一欄的資料範圍（假設名稱在A欄）
  var nameColumnRange = targetSheet.getRange(1, 1, targetSheet.getLastRow(), 1);
  
  // 取得名稱欄的值
  var nameColumnValues = nameColumnRange.getValues();
  
  var foundRows = [];
  
  // 迴圈遍歷名稱欄以找到指定的名稱
  for (var i = 0; i < nameColumnValues.length; i++) {
    var rowName = nameColumnValues[i][0];
    
    if (rowName == name) {
      foundRows.push(i + 1); // 將行數加入，轉換為1-based索引
      targetSheet.deleteRow(i + 1); //刪除當前行
    }
  }

}

//計算時間差
function calculateTimeDifference(dateTimeString) {
  // 將日期時間字符串轉換為 JavaScript Date 對象
  var targetDate = new Date(dateTimeString.replace(/-/g, '/'));

  // 取得當前時間
  var currentDate = new Date();

  // 計算時間差（毫秒）
  var timeDifference = currentDate - targetDate;

  // 將毫秒轉換為秒
  var seconds = Math.floor(timeDifference / 1000);

  // 計算具體時間差
  var days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  var hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  var minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  return hours +'小時' + minutes + '分鐘' + seconds+'秒'
}

//顯示tempSheet所有使用者
function showTempDate() {
  // 取得試算表的第一個（預設）工作表
  var targetSheet = sheetTemp.getSheets()[0];
  //暫存名字
  var tempName='';

  // 檢查是否有任何資料行
  var lastRow = targetSheet.getLastRow();
  if (lastRow === 0) {
    return '無';  // 若沒有資料行，直接返回無
  }

  // 取得第一欄的資料範圍（假設名稱在A欄）
  var nameColumnRange = targetSheet.getRange(1, 1, targetSheet.getLastRow(), 1);
  
  // 取得名稱欄的值
  var nameColumnValues = nameColumnRange.getValues();
  
  var foundRows = [];
  
  // 迴圈遍歷名稱欄以找到指定的名稱
  for (var i = 0; i < nameColumnValues.length; i++) {
    var rowName = nameColumnValues[i][0];
    foundRows.push(i + 1);
    tempName += targetSheet.getRange(i + 1, 1).getValue() + ',';
  }
  return tempName //回傳tempName
}
