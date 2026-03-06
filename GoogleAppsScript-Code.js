/**
 * Google Apps Script for Web App.
 * Deploy as: Web app → Execute as: Me → Who has access: Anyone.
 * Your sheet must have headers in row 1: No | Ism Familya | Telefon raqar | Shaxar | Time
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var lastRow = sheet.getLastRow();
    var no = lastRow >= 1 ? lastRow : 1; // "No" = row number (or use 1-based count)

    sheet.appendRow([
      no,
      data.full_name || "",
      data.phone || "",
      data.city || "",
      data.time || new Date().toISOString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
