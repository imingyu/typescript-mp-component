export type AnyFunction = (...args: any[]) => any;

/** 小程序组件属性类型 */
export type MpPropType =
    | typeof String
    | typeof Object
    | typeof Number
    | typeof Boolean
    | typeof Function
    | typeof Array
    | null;

/** 小程序组件属性 */
export interface MpComponentProp<T = any, C extends MpComponentInstance = any> {
    type: MpPropType;
    value?: T;
    observer?: (this: C, oldVal: T, newVal: T) => void;
}

export type MpComponentProperties<P extends object = any, C extends MpComponentInstance = any> = {
    [prop in keyof P]: MpPropType | MpComponentProp<P[prop], C>;
};

/** 小程序组件配置对象 */
export interface MpComponentOptions {
    /**
     * [启用多slot支持](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#组件wxml的slot)
     */
    multipleSlots?: boolean;
    /**
     * [组件样式隔离](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#组件样式隔离)
     */
    addGlobalClass?: boolean;
    /**
     * [组件样式隔离](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#组件样式隔离)
     */
    styleIsolation?: 'isolated' | 'apply-shared' | 'shared' | 'page-isolated' | 'page-apply-shared' | 'page-shared';
    /**
     * [纯数据字段](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/pure-data.html) 是一些不用于界面渲染的 data 字段，可以用于提升页面更新性能。从小程序基础库版本 2.8.2 开始支持。
     */
    pureDataPattern?: RegExp;
    /**
     * [虚拟化组件节点](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#%E8%99%9A%E6%8B%9F%E5%8C%96%E7%BB%84%E4%BB%B6%E8%8A%82%E7%82%B9) 使自定义组件内部的第一层节点由自定义组件本身完全决定。从小程序基础库版本 [`2.11.2`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html) 开始支持 */
    virtualHost?: boolean;
}

export interface MpViewInstance<D extends object = any> {
    /** 数据对象，只读，修改只可以通过setData进行修改 */
    readonly data: D;
    /** 组件的文件路径 */
    readonly is: string;
    /** 设置组件数据触发UI更新（异步），同时改变对应的 `this.data` 的值（同步）。
     *
     * **注意**
     *
     * - **直接修改 this.data 而不调用 this.setData 是无法改变页面的状态的，还会造成数据不一致**。
     * - 仅支持设置可 JSON 化的数据。
     * - 单次设置的数据不能超过1024kB，请尽量避免一次设置过多的数据。
     * - 请不要把 data 中任何一项的 value 设为 `undefined` ，否则这一项将不被设置并可能遗留一些潜在问题。
     */
    setData: (data: Partial<D>, callback?: () => void) => void;
    /** 返回页面标识符（一个字符串），可以用来判断几个自定义组件实例是不是在同一个页面内 */
    getPageId: () => string;
    /** 选取当前组件节点所在的组件实例（即组件的引用者），返回它的组件实例对象（会被 wx://component-export 影响） */
    selectOwnerComponent: <T extends MpViewInstance>() => T;
    /** 使用选择器选择组件实例节点，返回匹配到的第一个组件实例对象（会被 wx://component-export 影响） */
    selectComponent: <T extends MpViewInstance>(selector: string) => T | undefined;
    /** 使用选择器选择组件实例节点，返回匹配到的全部组件实例对象组成的数组（会被 wx://component-export 影响） */
    selectAllComponents: <T extends MpViewInstance>(selector: string) => T[];
}

export interface MpComponentTriggerEventOption {
    /** 事件是否冒泡
     *
     * 默认值： `false`
     */
    bubbles?: boolean;
    /** 事件是否可以穿越组件边界，为false时，事件将只能在引用组件的节点树上触发，不进入其他任何组件内部
     *
     * 默认值： `false`
     */
    composed?: boolean;
    /** 事件是否拥有捕获阶段
     *
     * 默认值： `false`
     */
    capturePhase?: boolean;
}

/** 小程序组件实例对象 */
export interface MpComponentInstance<
    D extends object = any,
    P extends object = any,
    C extends MpComponentInstance = any
> extends MpViewInstance<D & P> {
    /** 节点id */
    readonly id: string;
    /** 节点dataset */
    readonly dataset: any;
    /** 组件的对外属性，是属性名到属性设置的映射表 */
    readonly properties?: MpComponentProperties<P, C>;
    readonly initData: D;
    /** 组件的额外配置，包括样式隔离等 */
    options?: MpComponentOptions;
    /** 组件接受的外部样式类 */
    externalClasses?: string | string[];
    /** 触发事件 */
    triggerEvent: <T = any>(name: string, detail?: T, options?: MpComponentTriggerEventOption) => void;
    [prop: string]: any;
}

/** 小程序页面实例对象 */
export interface MpPageInstance<D extends object = any, Q extends object = any> extends MpViewInstance<D> {
    /** 页面参数对象 */
    readonly options: Q;
    /** 页面路由 */
    readonly route: string;
    [prop: string]: any;
}

export interface MpComponentEventTarget<T extends object = any> {
    id?: string;
    dataset: T;
}

export interface MpComponentEvent<T = any> {
    type: string;
    detail?: T;
    target: MpComponentEventTarget;
    currentTarget: MpComponentEventTarget;
}

export interface MpViewEachResult {
    data: any[];
    other: any[];
    methods: Record<string, AnyFunction>;
    lifes: Record<string, AnyFunction>;
}

export interface MpViewTodoResult {
    data: any[];
    other: any[];
    methods: Record<string, AnyFunction[]>;
    lifes: Record<string, AnyFunction[]>;
}

export interface MpViewMixinTodoResult extends MpViewTodoResult {
    mixinMethods: Record<string, Record<string, AnyFunction>>;
}
