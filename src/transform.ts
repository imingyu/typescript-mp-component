/* eslint-disable @typescript-eslint/no-invalid-this */
import type { MpView, MpPage } from './class';
import { MpComponent } from './class';
import type { AnyFunction, MpViewEachResult, MpViewMixinTodoResult, MpViewTodoResult } from './types';
import { isEmptyObject } from './util';

const pageLifeTimes: Record<string, string> = {
    onPageLifeShow: 'show',
    onPageLifeHide: 'hide',
    onPageLifeResize: 'resize',
    onPageLifeRouteDone: 'routeDone'
};

const eachObject = <T = any, K extends keyof T = keyof T>(obj: T, handler: (key: K, val: T[K]) => void) => {
    Object.getOwnPropertyNames(obj).forEach((k) => {
        const v = (obj as any)[k];
        if (k !== '$mx' && k !== '__proto__' && k !== 'constructor' && typeof v !== 'undefined' && v !== null) {
            handler(k as any, v);
        }
    });
};

const eachView = (vm: MpView, res: MpViewEachResult, lifeNames: string[]) => {
    const isComponent = vm instanceof MpComponent;
    const other: any = {};
    let hasOther;
    eachObject(vm, (k, v) => {
        if (k === 'data' || (isComponent && (k as any) === 'initData')) {
            res.data.push(v);
            return;
        }
        if (typeof v === 'function') {
            if (lifeNames.indexOf(k) !== -1) {
                if (!(k in res.lifes)) {
                    res.lifes[k] = v;
                }
                return;
            }
            if (!(k in res.methods)) {
                res.methods[k] = v;
            }
            return;
        }
        hasOther = true;
        other[k] = v;
    });
    hasOther && res.other.push(other);
};

const mergeEachResult = (target: MpViewTodoResult, source: MpViewEachResult): MpViewTodoResult => {
    target.data.push(...source.data);
    target.other.push(...source.other);
    Object.keys(source.lifes).forEach((name) => {
        target.lifes[name] = target.lifes[name] || [];
        target.lifes[name].push(source.lifes[name]);
    });
    Object.keys(source.methods).forEach((name) => {
        target.methods[name] = target.methods[name] || [];
        target.methods[name].push(source.methods[name]);
    });
    return target;
};

const eachViewMixins = (vm: MpView, lifeNames: string[]): MpViewMixinTodoResult => {
    const res: MpViewMixinTodoResult = {
        data: [],
        other: [],
        methods: {},
        mixinMethods: {},
        lifes: {}
    };
    if (vm.$mx) {
        const mixins: Array<[string, MpView]> = [];
        const noOrderMixins: Array<[string, MpView]> = [];
        const mxOrder = vm.$mxOrder || {};

        Object.keys(vm.$mx).forEach((k) => {
            if (String(parseInt(String(mxOrder[k]))) === String(mxOrder[k])) {
                // 顺序值越小的，越先执行/合并
                mixins[mxOrder[k]] = [k, vm.$mx[k]];
                return;
            }
            // 没有标明顺序值的默认排在有顺序值的后面
            noOrderMixins.push([k, vm.$mx[k]]);
        });

        mixins.concat(noOrderMixins).forEach(([name, mixin]) => {
            if (!mixin) {
                return;
            }
            const mixinResult = eachViewPrototype(mixin, lifeNames);
            mergeEachResult(res, mixinResult);
            if (!isEmptyObject(mixinResult.methods)) {
                res.mixinMethods[name] = mixinResult.methods;
            }
        });
    }
    return res;
};

const reverseEachResult = (res: MpViewEachResult | MpViewTodoResult) => {
    res.data.reverse();
    res.other.reverse();
    Object.keys(res.methods).forEach((k) => {
        if (Array.isArray(res.methods[k])) {
            (res.methods[k] as AnyFunction[]).reverse();
        }
    });
    Object.keys(res.lifes).forEach((k) => {
        if (Array.isArray(res.lifes[k])) {
            (res.lifes[k] as AnyFunction[]).reverse();
        }
    });
};

const eachViewPrototype = (vm: MpView, lifeNames: string[]): MpViewEachResult => {
    const res: MpViewEachResult = {
        data: [],
        other: [],
        methods: {},
        lifes: {}
    };
    eachView(vm, res, lifeNames);
    while ((vm = Object.getPrototypeOf(vm))) {
        if (Object.prototype.hasOwnProperty.call(vm, '$break')) {
            break;
        }
        eachView(vm, res, lifeNames);
    }
    // 原型上的数据/方法排在前面合并/执行
    reverseEachResult(res);
    return res;
};

const mergeMethods = (source: Record<string, AnyFunction[]>): Record<string, AnyFunction> => {
    return Object.keys(source).reduce((sum: Record<string, AnyFunction>, k) => {
        if (!Array.isArray(source[k])) {
            return sum;
        }
        sum[k] = function (...args) {
            let output;
            // eslint-disable-next-line prefer-rest-params
            source[k].forEach((fun) => {
                if (typeof fun === 'function') {
                    output = fun.apply(this, args);
                }
            });
            return output;
        };
        return sum;
    }, {});
};

const convertToViewConfig = (eachResult: MpViewTodoResult, isComponent = false) => {
    const config: any = {
        data: {}
    };

    // 处理data
    if (eachResult.data.length) {
        Object.assign.apply(null, [config.data, ...eachResult.data]);
    }

    // 处理other
    if (eachResult.other.length) {
        const configKeys = ['behaviors', 'properties', 'options'];
        const finalOther = Object.assign.apply(null, [{}, ...eachResult.other]);
        let configOther: any;
        configKeys.forEach((k) => {
            if (k in finalOther) {
                configOther = configOther || {};
                configOther[k] = finalOther[k];
                delete finalOther[k];
            }
        });
        if (configOther) {
            Object.assign(config, configOther);
        }
        if (!isEmptyObject(finalOther)) {
            const initLifeName = isComponent ? 'created' : 'onLoad';
            eachResult.lifes[initLifeName] = eachResult.lifes[initLifeName] || [];
            eachResult.lifes[initLifeName].unshift(function (this: any) {
                if (this.__tmcOtherInjected__) {
                    return;
                }
                this.__tmcOtherInjected__ = true;
                Object.assign(this, finalOther);
            });
        }
    }

    // 处理page life
    const pageLifetimesOptions: Record<string, AnyFunction> = {};
    if (isComponent) {
        const pageLifeMethods: Record<string, AnyFunction[]> = {};
        Object.keys(pageLifeTimes).forEach((k) => {
            pageLifeMethods[k] = eachResult.methods[k];
            delete eachResult.methods[k];
        });
        const sourcePageLifetimes = mergeMethods(pageLifeMethods);
        Object.keys(sourcePageLifetimes).forEach((k) => {
            pageLifetimesOptions[pageLifeTimes[k]] = sourcePageLifetimes[k];
        });
        if (!isEmptyObject(pageLifetimesOptions)) {
            config.pageLifetimes = pageLifetimesOptions;
        }
    }

    // 处理函数
    const methods = mergeMethods(eachResult.methods);
    const lifetimes = mergeMethods(eachResult.lifes);
    if (isComponent) {
        config.methods = methods;
        config.lifetimes = lifetimes;
    } else {
        Object.assign(config, methods, lifetimes);
    }
    return config;
};

const toViewConfig = (spec: MpPage | MpComponent) => {
    const isComponent = spec instanceof MpComponent;
    const lifeNames = isComponent
        ? ['created', 'attached', 'ready', 'moved', 'detached', 'error']
        : ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload'];
    const mixins = eachViewMixins(spec, lifeNames);
    const mixinMethods = mixins.mixinMethods;
    mixins.methods = {};

    const res = mergeEachResult(mixins, eachViewPrototype(spec, lifeNames));

    if (spec.$mx) {
        const mixinPageLifes: Record<string, AnyFunction[]> = {};
        const finalMethodKeys = Object.keys(res.methods);
        Object.keys(mixinMethods).forEach((name) => {
            const currentMixMethodKeys = Object.keys(mixinMethods[name]);
            const repeatMethodName = currentMixMethodKeys.find(
                (k) => finalMethodKeys.includes(k) && (isComponent ? !(k in pageLifeTimes) : true)
            );
            if (repeatMethodName) {
                throw new Error(`自身方法名(${repeatMethodName})与Mixin($mx.${name})中的方法名重复，请修改!`);
            }
            currentMixMethodKeys.forEach((k) => {
                if (isComponent && k in pageLifeTimes) {
                    mixinPageLifes[k] = mixinPageLifes[k] || [];
                    mixinPageLifes[k].push(mixinMethods[name][k]);
                    return;
                }
                if (k in res.methods) {
                    throw new Error(`$mx.${name}中的${k}方法与已创建的方法名重复，请修改!`);
                }
                res.methods[k] = [mixinMethods[name][k]];
            });
        });

        // 把$mx下的属性全部指向this
        const mxNames = Object.keys(spec.$mx);
        const initLifeName = spec instanceof MpComponent ? 'created' : 'onLoad';
        res.lifes[initLifeName] = res.lifes[initLifeName] || [];
        res.lifes[initLifeName].unshift(function (this: any) {
            if (this.$mx) {
                return;
            }
            this.$mx = {};
            mxNames.forEach((name) => {
                this.$mx[name] = this;
            });
        });

        // 把mixin的page life方法放到最前面
        isComponent &&
            Object.keys(mixinPageLifes).forEach((k) => {
                res.methods[k] = res.methods[k] || [];
                res.methods[k].unshift(...mixinPageLifes[k]);
            });
    }
    return convertToViewConfig(res, spec instanceof MpComponent);
};

export const toMpPageConfig = (constructor: new () => MpPage) => {
    return toViewConfig(new constructor());
};

export const toMpComponentConfig = (constructor: new () => MpComponent) => {
    return toViewConfig(new constructor());
};
