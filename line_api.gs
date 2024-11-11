//line bot token
var CHANNEL_ACCESS_TOKEN = 'your_token';
//google sheet ID
var sheet = SpreadsheetApp.openById('your_sheet_id');
var sheetTemp = SpreadsheetApp.openById('your_temp_sheet_id');

//收發訊息
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
