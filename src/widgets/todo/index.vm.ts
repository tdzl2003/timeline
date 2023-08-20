import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
  toJS,
} from 'mobx';
import { now } from 'mobx-utils';
import { str2TimeDiff } from './times';

const STORAGE_KEY = '$TODO_SAVE';

export interface NotifyItem {
  at: number;

  msg: string;
}

export interface AccountItem {
  name: string;

  account: string;

  notifies: NotifyItem[];
}

export interface CommandItem {
  reg: RegExp;
  help: string;

  handle: (this: TodoViewModel, ...args: string[]) => void;
}

const cmdList: CommandItem[] = [
  {
    reg: /^\/(?:h|help)/,
    help: '/h /help 显示帮助',
    handle() {
      this.log('帮助：');
      for (const item of cmdList) {
        this.log('\t' + item.help);
      }
    },
  },
  {
    reg: /^\/deleteAcc/,
    help: '/deleteAcc 删除当前账号',
    handle() {
      if (!this.currentAccount) return;
      const idx = this.accounts.indexOf(this.currentAccount);
      if (idx >= 0) {
        this.accounts.splice(idx, 1);
      }
      this.currentAccount = this.accounts[0] || null;
    },
  },
  {
    reg: /^\/(?:c|clear)/,
    help: '/c /clear 清除所有通知',
    handle() {
      if (!this.currentAccount) return;
      this.currentAccount.notifies.splice(0);
    },
  },
  {
    reg: /^\/(?:n|notify) (\w+) (.+)/,
    help: '/n /notify {1d|1h|1m|1s} {msg',
    handle(exp, msg) {
      if (!this.currentAccount) return;
      const expAt = Date.now() + str2TimeDiff(exp);
      this.currentAccount.notifies.push({
        at: expAt,
        msg,
      });
    },
  },
];

export class TodoViewModel {
  @observable
  accounts: AccountItem[] = [];

  @observable
  currentAccount: AccountItem | null = null;

  @observable
  logs: string[] = [];

  constructor() {
    makeObservable(this);

    this.load();
    window.addEventListener('beforeunload', () => {
      this.save();
    });
    window.addEventListener('visibilitychange', () => {
      this.save();
    });
  }

  load(): void {
    const content = localStorage.getItem(STORAGE_KEY);
    if (content) {
      try {
        runInAction(() => {
          this.accounts = JSON.parse(content);
          this.currentAccount = this.accounts[0] || null;
        });
      } catch (e) {
        alert('加载失败，请手动恢复数据或清除浏览器本地存储。');
        throw e;
      }
    }
  }

  save(): void {
    const data = JSON.stringify(toJS(this.accounts));
    localStorage.setItem(STORAGE_KEY, data);
  }

  log(cmd: string) {
    this.logs.push(cmd + '\n');
  }

  getNotifyCnt(acc: AccountItem) {
    return computed(() => {
      const n = now(60000);
      let ret = 0;
      for (const item of acc.notifies) {
        if (item.at < n) {
          ++ret;
        }
      }
      return ret;
    });
  }

  @action
  processAction(cmd: string) {
    this.log('$ ' + cmd);
    for (const item of cmdList) {
      const m = item.reg.exec(cmd);
      if (m) {
        item.handle.apply(this, [...m].slice(1));
      }
    }
  }
}
