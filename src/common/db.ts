interface Window {
    indexedDB?: any;
    webkitindexedDB?: any;
    msIndexedDB?: any;
    mozIndexedDB?: any;
}

interface Store {
    [key: string]: any;
}

interface DB {
    store: Store;
    indexedDB: any;
    dbName: string;
    initDB: () => Promise<any>;
    openDB: () => Promise<any>;
    deleteDB: (db: any) => void;
    closeDB: (db: any) => Promise<boolean>;
    insert: (tableName: any, data: any) => Promise<boolean>;
    update: (tableName: any, data: any) => Promise<boolean>;
    delete: (tableName: any, keyValue: any) => Promise<boolean>;
    get: (tableName: any, keyValue?: any, indexCursor?: any) => any;
    createCursorIndex: (tableName: any, cursorIndex: any, unique: any) => any;
}

declare const window: Window;

const dbConfig: DB = {
    dbName: 'todos',
    indexedDB:
        window.indexedDB ||
        window.webkitindexedDB ||
        window.msIndexedDB ||
        window.mozIndexedDB,
    // name:表名  key:主键   cursorIndex 索引
    store: {
        lists: {
            name: "lists",
            key: "local_id",
            cursorIndex: [{ 
                name: "title", 
                unique: false 
            }]
        },
        tasks: {
            name: "tasks",
            key: "local_id",
            cursorIndex: [{ 
                name: "title", 
                unique: false 
            }, {
                name: 'list_id',
                unnique: false
            }]
        },
        changes: {
            name: 'changes',
            key: 'time',
            cursorIndex: []
        }
    },
    initDB: function () {
        return new Promise((resolve, reject) => {
            localStorage.dbVersion = localStorage.dbVersion ? JSON.parse(localStorage.dbVersion) + 1 : 1
            const request = this.indexedDB.open(this.dbName, localStorage.dbVersion);
            request.onerror = (e: { target: { error: string; }; }) => {
                reject("打开数据库失败: " + e.target.error)
            }
            request.onsuccess = () => {
                resolve("打开数据库成功")
            }
            request.onupgradeneeded = (e: { target: { result: any; }; }) => {
                // console.log('initDB: upgrade')
                let db = e.target.result;
                for (let t in this.store) {
                    if (!db.objectStoreNames.contains(this.store[t].name)) {
                        let objectStore = db.createObjectStore(this.store[t].name, {
                            keyPath: this.store[t].key,
                            autoIncrement: true
                        })
                        for (let i = 0; i < this.store[t].cursorIndex.length; i++) {
                            const element = this.store[t].cursorIndex[i];
                            objectStore.createIndex(element.name, element.name, {
                                unique: element.unique
                            })
                        }
                    }
                }
                resolve(true)
            }
        })
    },
    openDB: function () {
        return new Promise((resolve, reject) => {
            let request = this.indexedDB.open(this.dbName, localStorage.dbVersion)
            request.onerror = (e: { target: { error: string; }; }) => {
                reject("IndexedDB 数据库打开错误：" + e.target.error)
            }
            request.onsuccess = (e: { target: { result: unknown; }; }) => {
                resolve(e.target.result)
            }
            request.onupgradeneeded = () => {
                // console.log('openDB: upgrade')
            }
        })
    },
    deleteDB: function (db: any) {
        let deleteQuest = this.indexedDB.deleteDatabase(db);
        deleteQuest.onerror = () => {
            return Promise.resolve(false);
        }
        deleteQuest.onsuccess = () => {
            localStorage.dbVersion = 1
            return Promise.resolve(true);
        }
    },
    closeDB: async function (db: any) {
        try {
            let d;
            if (!db) d = await this.openDB()
            let closeQuest = d.closeDB();
            return new Promise(resolve => {
                closeQuest.onerror = function () {
                    resolve(false);
                };
                closeQuest.onsuccess = function () {
                    resolve(true);
                };
            });
        } catch (error) {
            return Promise.resolve(false);
        }
    },
    insert: async function (tableName: any, data: any) {
        try {
            let db = await this.openDB();
            let request = db
                .transaction(tableName, "readwrite")
                .objectStore(tableName)
                .add(data);

            return new Promise((resolve, reject) => {
                request.onerror = function (e: { target: { error: string; }; }) {
                    reject("添加数据出错: " + e.target.error);
                };
                request.onsuccess = function () {
                    resolve(true);
                };
            });
        } catch (error) {
            console.log(error);
            return Promise.resolve(false);
        }
    },
    update: async function (tableName: any, data: any) {
        try {
            let db = await this.openDB();
            let request = db.transaction(tableName, "readwrite").objectStore(tableName).put(data);
            return new Promise((resolve, reject) => {
                request.onerror = function (e: { target: { error: string; }; }) {
                    reject("更新数据出错: " + e.target.error);
                };
                request.onsuccess = function () {
                    resolve(true);
                };
            });
        } catch (error) {
            console.log(error)
            return Promise.resolve(false);
        }
    },
    delete: async function (tableName: any, keyValue: any) {
        try {
            let db = await this.openDB()
            let request = db
                .transaction(tableName, "readwrite")
                .objectStore(tableName)
                .delete(keyValue);
            return new Promise((resolve, reject) => {
                request.onerror = (e: { target: { error: string; }; }) => {
                    reject("删除数据出错: " + e.target.error);
                }
                request.onsuccess = () => {
                    resolve(true);
                }
            })
        } catch (error) {
            return Promise.resolve(false);
        }
    },
    get: async function (tableName: any, keyValue: any, indexCursor: any) {
        try {
            let db = await this.openDB()
            let store = db.transaction(tableName, "readonly").objectStore(tableName)
            let request: { onerror: (e: any) => void; onsuccess: (e: any) => void; };
            request = !keyValue
                ? store.openCursor()
                : indexCursor
                    ? store.index(indexCursor).get(keyValue)
                    : store.get(keyValue);
            let data: any[] = [];
            return new Promise((resolve, reject) => {
                request.onerror = function (e: { target: { error: string; }; }) {
                    reject("查询数据出错: " + e.target.error);
                };
                request.onsuccess = (e: { target: { result: { value: any; continue: () => void; }; }; }) => {
                    if (!keyValue && !indexCursor) {
                        if (e.target.result) {
                            data.push(e.target.result.value);
                            e.target.result.continue();
                        } else {
                            resolve(data);
                        }
                    } else {
                        resolve([e.target.result]);
                    }
                };
            });
        } catch (error) {
            console.log(error)
            return Promise.reject(error);
        }
    },
    // 创建游标索引
    createCursorIndex: function (tableName: any, cursorIndex: any, unique: any) {
        let request = this.indexedDB.open(this.dbName, localStorage.dbVersion+1)
        request.onerror = (e: { target: { error: { message: any; }; }; }) => {
            console.log(e.target.error.message)
        }
        request.onsuccess = (e: any) => {
            console.log('success')
        }
        request.onupgradeneeded = (e: { currentTarget: { transaction: { objectStore: (arg0: any) => any; }; }; }) => {
            localStorage.dbVersion = JSON.parse(localStorage.dbVersion) + 1
            const store = e.currentTarget.transaction.objectStore(tableName);
            store.createIndex(cursorIndex, cursorIndex, {
                unique: unique
            })
            return Promise.resolve();
        }
    }
}

export default dbConfig;