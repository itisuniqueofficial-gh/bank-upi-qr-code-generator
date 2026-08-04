/* UPI QR Code Generator — payload builder and summaries */

const generator = (() => {
  const buildUpiPayload = (data) => {
    const { account, ifsc, name = '', amount = '', note = '' } = data;
    const payee = `${account}@${ifsc}.ifsc.npci`;
    const params = [`pa=${encodeURIComponent(payee)}`];
    if (name) params.push(`pn=${encodeURIComponent(name)}`);
    if (amount) params.push(`am=${encodeURIComponent(amount)}`);
    if (note) params.push(`tn=${encodeURIComponent(note)}`);
    params.push('cu=INR');
    return `upi://pay?${params.join('&')}`;
  };

  const buildSummary = (data) => {
    const { name = '', account = '', ifsc = '', amount = '', note = '' } = data;
    const lines = [
      'UPI QR Code Generator',
      '',
      `Name: ${name}`,
      `Account: ${account}`,
      `IFSC: ${ifsc}`,
      `Amount: ${amount ? `₹${amount}` : 'Any amount'}`,
      `Note: ${note || '—'}`,
    ];
    return lines.join('\n');
  };

  return { buildUpiPayload, buildSummary };
})();

export { generator };
