module.exports = {
  generateSecret: () => "JBSWY3DPEHPK3PXP",
  generateURI: ({ secret, label, issuer }) =>
    `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
  verify: async ({ token, secret }) => ({ valid: token === "123456", delta: 0 }),
  verifySync: ({ token, secret }) => ({ valid: token === "123456", delta: 0 }),
  generate: async ({ secret }) => "123456",
  generateSync: ({ secret }) => "123456",
};
