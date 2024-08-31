<div id="divNeteaseSiriusCloudAttach" style="clear: both; margin-top: 1px; margin-bottom: 1px;
       font-family: verdana,Arial,Helvetica,sans-serif;
      border: 1px solid rgba(238, 238, 239, 1);
      box-shadow: 0px 5px 15px rgba(203, 205, 210, 0.3);border-radius: 6px;color: #262A33;">
    <div style="font-size: 13px; padding: 12px 0px 12px 0px; line-height: 16px;border-bottom: 1px solid #ECECED;">
        <b style="padding-left: 12px;">网易灵犀办公云附件</b>
    </div>
    <#list attachments as it>
    <div style="background: #fff; padding: 0px 12px;border-radius: 12px;position: relative;">
        <div style="width: 24px;position: absolute;height: 40px;left:16px;top:4px;">
            <a href="${it.url}" style="text-underline: none;">
                <img width="24px" height="24px"
                     src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png"
                     border="0" title="云附件">
            </a>
        </div>
        <div style="padding-right: 32px;margin-left: 30px; border-bottom: 1px solid rgba(38, 42, 51, 0.08);margin-top: 16px;padding-bottom: 16px;">
            <div style="margin-left: 4px;">
                <div style="padding: 1px; font-size: 14px; line-height: 14px;">
                    <a style=" text-decoration: none;color: #262A33;display: block" href="${it.url}" target="_blank" rel="noopener" download="${it.downloadUrl}">
                        ${it.fixedFileName}
                    </a>
                </div>
                <div style="padding: 1px;color: #262A33;opacity: 0.4;font-size: 12px;margin-top: 4px;">
                    ${it.fileSizeText}&nbsp;|&nbsp;过期时间：${it.expireTimeText}
                </div>
            </div>
        </div>
        <a class="divNeteaseSiriusCloudAttachItem" href="${it.url}" download="${it.downloadUrl}" file-id="${it.identity}" file-name="${it.fileName}" file-size="${it.fileSize}" expired="${it.expireTime}"
            style=" text-decoration: none;display: block; font-size: 12px; line-height: 12px;position: absolute;right: 16px;top:50%;margin-top: -14px;color:#386EE7">下载</a>
    </div>
    </#list>
</div>