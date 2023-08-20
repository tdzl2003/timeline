import {
  action,
  computed,
  IComputedValue,
  observable,
  runInAction,
} from 'mobx';
import { Children, jsx, Element, computedMapperFn } from 'mobxact';
import { AccountItem, NotifyItem, TodoViewModel } from './index.vm';
import styles from './index.less';
import * as classnames from 'classnames';
import { timeDiff2Str } from './times';
import { now } from 'mobx-utils';

export function List<T>({
  data,
  renderItem,
}: {
  data: T[];
  renderItem: (v: T) => Element;
}): IComputedValue<Children> {
  renderItem = computedMapperFn(renderItem);
  return computed(() => {
    return data.map((v) => renderItem(v));
  });
}

function AccountListItem({ acc, vm }: { acc: AccountItem; vm: TodoViewModel }) {
  const notCnt = vm.getNotifyCnt(acc);
  return (
    <div
      className={computed(() =>
        classnames(styles.listItem, vm.currentAccount == acc && styles.active)
      )}
      onClick={() => {
        vm.currentAccount = acc;
      }}
    >
      <div className={styles.title}>{computed(() => acc.name)}</div>
      {computed(() =>
        notCnt.get() ? <div className={styles.notifyCnt}>{notCnt}</div> : null
      )}
    </div>
  );
}

function NotifyItemView({ acc, item }: { acc: AccountItem; item: NotifyItem }) {
  const diff = computed(() => {
    return timeDiff2Str(item.at - now(1000));
  });
  const expired = computed(() => {
    return item.at < now(1000);
  });
  return (
    <div
      className={computed(() => {
        return classnames(styles.notItem, expired.get() && styles.expired);
      })}
    >
      ({diff}): {item.msg}
      <div
        className={styles.doneBtn}
        onClick={action(() => {
          const idx = acc.notifies.indexOf(item);
          if (idx >= 0) {
            acc.notifies.splice(idx, 1);
          }
        })}
      >
        完成
      </div>
    </div>
  );
}

function MainContent({ acc, vm }: { acc: AccountItem; vm: TodoViewModel }) {
  return (
    <div className={styles.content}>
      <p>
        <span className={styles.title}>{computed(() => acc.name)}</span>
        <span className={styles.subtitle}>({computed(() => acc.account)})</span>
      </p>
      <div className={styles.notifyList}>
        <List
          data={acc.notifies}
          renderItem={(item) => <NotifyItemView acc={acc} item={item} />}
        />
      </div>
    </div>
  );
}

function CreateAccount({ vm }: { vm: TodoViewModel }) {
  const account: AccountItem = observable({
    name: '',
    account: '',
    notifies: [],
  });

  return (
    <div className={styles.scroll}>
      <h1>新建账号</h1>
      <p>
        角色：{' '}
        <input
          value={computed(() => account.name)}
          autoFocus
          onInput={action((ev) => {
            account.name = ev.currentTarget.value;
          })}
        />
      </p>
      <p>
        邮箱：{' '}
        <input
          value={computed(() => account.account)}
          onInput={action((ev) => {
            account.account = ev.currentTarget.value;
          })}
        />
      </p>
      <p>
        <button
          onClick={action(() => {
            vm.accounts.push(account);
            vm.currentAccount = account;
          })}
        >
          保存
        </button>
      </p>
    </div>
  );
}

export function Todo() {
  const vm = new TodoViewModel();
  const cmd = observable.box('');

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div className={styles.scroll}>
          <List
            data={vm.accounts}
            renderItem={(acc) => <AccountListItem acc={acc} vm={vm} />}
          ></List>
        </div>
        <div
          className={styles.newBtn}
          onClick={() => (vm.currentAccount = null)}
        >
          +
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.main}>
          {computed(() => {
            if (vm.currentAccount) {
              return <MainContent vm={vm} acc={vm.currentAccount} />;
            }
            return <CreateAccount vm={vm} />;
          })}
        </div>
        <input
          placeholder="/help"
          value={cmd}
          autoFocus
          onInput={action((ev) => {
            cmd.set(ev.currentTarget.value);
          })}
          onKeyDown={(ev) => {
            if (ev.key == 'Enter') {
              runInAction(() => {
                vm.processAction(cmd.get());
                cmd.set('');
              });
            }
          }}
        ></input>
        <div className={styles.logs}>
          <List
            data={vm.logs}
            renderItem={(item) => <p className={styles.log}>{item}</p>}
          />
        </div>
      </div>
    </div>
  );
}
