"use strict";
const crypto = require("crypto");

function aes_encrypt(key, iv, msg) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(msg, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function sha384(msg) {
  const hash = crypto.createHash("sha384");
  hash.update(msg);
  return hash.digest("hex");
}

hexo.extend.tag.register(
  "encrypt",
  (args, content) => {
    const text = hexo.render.renderSync({ text: content, engine: "markdown" });

    const password = args[0];
    const hint = args[1];
    const hash = Buffer.from(sha384(password), "hex");
    const key = hash.subarray(0, 32);
    const iv = hash.subarray(32, 48);
    const cipher = aes_encrypt(key, iv, text);
    return `
    <div class="encrypt card" style="text-align:center;">
      <div style="font-size:1.1rem;">🔐 内容受密码保护</div>
      <p style="font-size:0.8rem;">密码提示：${hint}</p>
      <form class="search-form" onsubmit="decrypt(this.querySelector('a'));return false;">
        <input type="password" class="password search-input" placeholder="请输入密码" />
        <input type="hidden" class="cipher" value="${cipher}" />
        <a onclick="decrypt(this)" style="margin-left: .35em; margin-right: .35em">解密</a>
      </form>
    </div>
  `;
  },
  { ends: true }
);
