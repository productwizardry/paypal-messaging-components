import shell from 'shelljs';
import commandLineArgs from 'command-line-args';

const snapshotPath = (path = '') => `tests/functional/snapshots/${path}`;
const currentLocales = [...shell.ls(snapshotPath())];
const currentAccountsMap = currentLocales.reduce(
    (object, locale) => ({
        ...object,
        [locale]: [...shell.ls(snapshotPath(locale))]
    }),
    {}
);
// const currentAccountsList = Object.values(currentAccountsMap).flat();

const Account = accountArg => {
    const account = accountArg.toUpperCase();
    const ACCOUNT_MAX_LENGTH = 13;
    const DEV_PREFIX = 'DEV';

    if (account.length > ACCOUNT_MAX_LENGTH) {
        throw new Error(`Invalid account number length [${account}]. Expected length <= 13`);
    } else if (account.length === ACCOUNT_MAX_LENGTH) {
        return account;
    }

    const padLength = ACCOUNT_MAX_LENGTH - (DEV_PREFIX.length + account.length);
    const pad = Array(padLength + 1).join('0');
    return `${DEV_PREFIX}${pad}${account}`;
};

const Locale = localeArg => {
    const locale = localeArg.toUpperCase();
    console.log({ locale });
    if (locale.length !== 2) {
        throw new Error(`Invalid locale length for [${locale}]. Expected length = 2`);
    }
    if (!currentLocales.includes(locale)) {
        throw new Error(`Invalid locale [${locale}]. Expected one of [${currentLocales.join(', ')}]`);
    }
    return locale;
};

const scriptArgs = commandLineArgs([
    { name: 'locale', alias: 'l', type: Locale },
    { name: 'account', alias: 'a', type: Account }
]);

const isValidLocaleAccount = ({ locale, account }) => {
    const localeAccounts = currentAccountsMap[locale];
    if (!localeAccounts.includes(account)) {
        throw new Error(`Invalid locale [${account}]. Expected one of [${localeAccounts.join(', ')}]`);
    }
    return true;
};

const getFiles = ({ locale, account, type }) => {
    const files = shell.ls(snapshotPath(`${locale}/${account}/${type}/*.png`));
};

const list = shell.ls('tests/functional/snapshots');
console.log([...list]);
console.log(scriptArgs);
