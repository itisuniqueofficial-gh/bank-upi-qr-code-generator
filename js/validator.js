export const validator = (() => {
  const MAX_NAME = 80;
  const MAX_NOTE = 80;

  const validators = {
    name: (value) => {
      const v = value.trim();
      if (v.length < 2) return { ok: false, message: 'Name must be at least 2 characters.' };
      if (v.length > MAX_NAME) return { ok: false, message: `Name must be ${MAX_NAME} characters or fewer.` };
      return { ok: true };
    },
    account: (value) => {
      const v = value.trim();
      if (!/^\d+$/.test(v)) return { ok: false, message: 'Account number must contain only digits.' };
      if (v.length < 6) return { ok: false, message: 'Account number must be at least 6 digits.' };
      if (v.length > 20) return { ok: false, message: 'Account number must be 20 digits or fewer.' };
      return { ok: true };
    },
    ifsc: (value) => {
      const v = value.trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) {
        return { ok: false, message: 'IFSC must match the format: 4 letters, 0, then 6 alphanumeric characters.' };
      }
      return { ok: true };
    },
    confirm: (value, account) => {
      if (value.trim() !== account.trim()) return { ok: false, message: 'Account numbers do not match.' };
      return { ok: true };
    },
    amount: (value) => {
      const v = value.trim();
      if (v === '') return { ok: true };
      if (!/^\d+(\.\d{1,2})?$/.test(v)) {
        return { ok: false, message: 'Amount must be a positive number with up to 2 decimal places.' };
      }
      const n = Number(v);
      if (!(n > 0)) return { ok: false, message: 'Amount must be greater than zero.' };
      return { ok: true };
    },
    note: (value) => {
      const v = value.trim();
      if (v.length > MAX_NOTE) return { ok: false, message: `Note must be ${MAX_NOTE} characters or fewer.` };
      return { ok: true };
    },
  };

  const validateAll = (data) => {
    const checks = [
      ['name', validators.name(data.name)],
      ['account', validators.account(data.account)],
      ['ifsc', validators.ifsc(data.ifsc)],
      ['amount', validators.amount(data.amount)],
      ['note', validators.note(data.note)],
    ];
    const errors = checks.filter(([, r]) => !r.ok);
    const errorsMap = Object.fromEntries(errors);
    if (!errorsMap.account && !validators.confirm(data.confirm, data.account).ok) {
      errorsMap.confirm = 'Account numbers do not match.';
    }
    return { ok: errors.length === 0 && !errorsMap.confirm, errors: errorsMap };
  };

  return { MAX_NAME, MAX_NOTE, validators, validateAll };
})();
