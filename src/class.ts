/* eslint-disable brace-style */
import type {
    MpComponentInstance,
    MpComponentOptions,
    MpComponentProperties,
    MpComponentTriggerEventOption,
    MpPageInstance,
    MpViewInstance,
    MpViewSelectorQuery
} from './types';

export abstract class MpView<D extends object = any> implements MpViewInstance<D> {
    setData!: (data: Partial<D>, callback?: (() => void) | undefined) => void;
    createSelectorQuery!: () => MpViewSelectorQuery;
    selectOwnerComponent!: <T extends MpViewInstance<any>>() => T;
    selectComponent!: <T extends MpViewInstance<any>>(selector: string) => T | undefined;
    selectAllComponents!: <T extends MpViewInstance<any>>(selector: string) => T[];
    getPageId!: () => string;
    readonly is!: string;
    readonly data!: D;
    readonly $mx!: Record<string, MpView>;
    readonly $mxOrder?: Record<string, number>;
    $break() {}
}

export abstract class MpComponent<
        D extends object = any,
        P extends object = any,
        C extends MpComponentInstance = MpComponentInstance
    >
    extends MpView<D & P>
    implements MpComponentInstance<D, P, C>
{
    triggerEvent!: <T = any>(
        name: string,
        detail?: T | undefined,
        options?: MpComponentTriggerEventOption | undefined
    ) => void;
    readonly id!: string;
    readonly dataset!: any;
    readonly initData!: D;
    readonly properties?: MpComponentProperties<P, C>;
    options?: MpComponentOptions;
    externalClasses?: string | string[];
    $break() {}
}

export abstract class MpPage<D extends object = any, Q extends object = any>
    extends MpView<D>
    implements MpPageInstance<D, Q>
{
    readonly options!: Q;
    readonly route!: string;
    $break() {}
}

/** 适用于组件/页面的Mixin */
export abstract class MpViewMixin<D extends object = any> extends MpView<D> {
    /** Mixin类不可在混入其他Mixin */
    declare $mx: never;
}

/** 适用于页面的Mixin */
export abstract class MpComponentMixin<
    D extends object = any,
    P extends object = any,
    C extends MpComponentInstance = MpComponentInstance
> extends MpComponent<D, P, C> {
    /** Mixin类不可在混入其他Mixin */
    declare $mx: never;
}

/** 适用于页面的Mixin */
export abstract class MpPageMixin<D extends object = any, Q extends object = any> extends MpPage<D, Q> {
    /** Mixin类不可在混入其他Mixin */
    declare $mx: never;
}
