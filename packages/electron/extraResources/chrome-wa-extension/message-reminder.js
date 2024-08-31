const invalidLocalParts = ['the', '2', '3', '4', '123', '20info', 'aaa', 'ab', 'abc', 'acc', 'acc_kaz', 'account', 'accounts', 'accueil', 'ad', 'adi', 'adm', 'an', 'and', 'available',
    'b', 'c', 'cc', 'com', 'domain', 'domen', 'email', 'fb', 'foi', 'for', 'found', 'g', 'get', 'h', 'here', 'includes', 'linkedin', 'mailbox', 'more', 'my_name', 'n',
    'name', 'need', 'nfo', 'ninfo', 'now', 'o', 'online', 'post', 'rcom.TripResearch.userreview.UserReviewDisplayInfo', 's', 'sales2', 'test', 'up', 'we', 'www', 'xxx', 'xxxxx',
    'y', 'username', 'firstname.lastname'
];
function prepareEmails(emails) {
    var emailsNew = [];
    for (var iNo = 0; iNo < emails.length; iNo++) {
        var email = emails[iNo].toLowerCase().trim();

        if ((emailsNew.indexOf(email) < 0)) {

            var ext = email.slice(-4);
            if ((ext === '.png') || (ext === '.jpg') || (ext === '.gif') || (ext === '.css')) {
                continue;
            }
            var ext2 = email.slice(-3);
            if ((ext2 === '.js')) {
                continue;
            }

            var newEmail = email.replace(/^(x3|x2|u003)[b|c|d|e]/i, '');
            newEmail = newEmail.replace(/^sx_mrsp_/i, '');
            newEmail = newEmail.replace(/^3a/i, '');
            if (newEmail !== email) {
                email = newEmail;
                if (email.search(/\b[a-z\d-][_a-z\d-+]*(?:\.[_a-z\d-+]*)*@[a-z\d]+[a-z\d-]*(?:\.[a-z\d-]+)*(?:\.[a-z]{2,63})\b/i) === -1) {
                    continue;
                }
            }

            if (email.search(/(no|not)[-|_]*reply/i) !== -1) {
                continue;
            }
            ;
            if (email.search(/mailer[-|_]*daemon/i) !== -1) {
                continue;
            }
            ;
            if (email.search(/reply.+\d{5,}/i) !== -1) {
                continue;
            }
            ;
            if (email.search(/\d{13,}/i) !== -1) {
                continue;
            }
            ;
            if (email.indexOf('.crx1') > 0) {
                continue;
            }
            ;
            if (email.indexOf('nondelivery') > 0) {
                continue;
            }
            ;
            if (email.indexOf('notification') > 0) {
                continue;
            }
            ;

            var localPart = email.substring(0, email.indexOf('@'));
            if (invalidLocalParts.indexOf(localPart) !== -1) {
                continue;
            }
            ;

            if ((email !== '') && (emailsNew.indexOf(email) === -1)) {
                emailsNew.push(email);
            }
        }
    }

    return emailsNew;
}

function searchEmailsO(pageText) {
    let emails = pageText.match(/\b[a-z\d-][_a-z\d-+]*(?:\.[_a-z\d-+]*)*@[a-z\d]+[a-z\d-]*(?:\.[a-z\d-]+)*(?:\.[a-z]{2,63})\b/gi) || [];
    if (emails) {
        return prepareEmails(emails);
    }
}
var emailsOnPage = searchEmailsO(document.body.innerHTML) || [];
const reminderOpening = emailsOnPage.length > 0;
if (reminderOpening) {
    if (chrome.app && typeof chrome.app.isInstalled!=='undefined') {
        chrome.runtime.sendMessage({ reminderOpening: reminderOpening });
    }
    
}
document.addEventListener("visibilitychange", (event) => {
    if (chrome.app && typeof chrome.app.isInstalled!=='undefined') {
        if (document.visibilityState !== "visible") {
            chrome.runtime.sendMessage({ reminderOpening: false });
        } else {
            chrome.runtime.sendMessage({ reminderOpening: reminderOpening });
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.method === 'getEmailList') {
        const result = searchEmailsO(document.body.innerHTML) || [];
        console.log('result', result)
        
        chrome.storage?.local.get('CaptureEmailSaveType', function(storage) {
            sendResponse({
                data: {
                    emailList: result,
                    autoSave: Object.keys(storage) === 0 || storage.CaptureEmailSaveType === 'auto'
                },
                method: 'getEmailList'
            });
        });
        return true;
    }
})
