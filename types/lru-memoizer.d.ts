declare module 'lru-memoizer' {
    type INodeStyleCallBack<SuccessArg> = (
        err: NodeJS.ErrnoException,
        result?: SuccessArg
    ) => void;

    interface IMemoized<TResult> {
        <T1>(arg1: T1, cb: INodeStyleCallBack<TResult>): void;
        <T1, T2>(arg1: T1, arg2: T2, cb: INodeStyleCallBack<TResult>): void;
        <T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3, cb: INodeStyleCallBack<TResult>): void;
        <T1, T2, T3, T4>(arg1: T1, arg2: T2, arg3: T3, arg4: T4, cb: INodeStyleCallBack<TResult>): void;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            cb: INodeStyleCallBack<TResult>
        ): void;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6,
            cb: INodeStyleCallBack<TResult>
        ): void;
        keys: () => string[];
    }

    interface IMemoizedSync<TResult> {
        <T1>(arg1: T1): TResult;
        <T1, T2>(arg1: T1, arg2: T2): TResult;
        <T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3): TResult;
        <T1, T2, T3, T4>(arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5
        ): TResult;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6
        ): TResult;
        keys: () => string[];
    }

    interface IMemoizableFunction<TResult> {
        <T1>(arg1: T1, cb: INodeStyleCallBack<TResult>): void;
        <T1, T2>(arg1: T1, arg2: T2, cb: INodeStyleCallBack<TResult>): void;
        <T1, T2, T3>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            cb: INodeStyleCallBack<TResult>
        ): void;
        <T1, T2, T3, T4>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            cb: INodeStyleCallBack<TResult>
        ): void;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            cb: INodeStyleCallBack<TResult>
        ): void;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6,
            cb: INodeStyleCallBack<TResult>
        ): void;
    }

    interface IMemoizableFunctionSync<TResult> {
        <T1>(arg1: T1): TResult;
        <T1, T2>(arg1: T1, arg2: T2): TResult;
        <T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3): TResult;
        <T1, T2, T3, T4>(arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5
        ): TResult;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6
        ): TResult;
    }

    interface IHashingFunction {
        <T1>(arg1: T1): string;
        <T1, T2>(arg1: T1, arg2: T2): string;
        <T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3): string;
        <T1, T2, T3, T4>(arg1: T1, arg2: T2, arg3: T3, arg4: T4): string;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5
        ): string;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6
        ): string;
    }

    interface IItemMaxAgeFunction<TResult> {
        <T1>(arg1: T1, result: TResult): number;
        <T1, T2>(arg1: T1, arg2: T2, result: TResult): number;
        <T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3, result: TResult): number;
        <T1, T2, T3, T4>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            result: TResult
        ): number;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            result: TResult
        ): number;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6,
            result: TResult
        ): number;
    }

    interface IBypassFunction {
        <T1>(arg1: T1): boolean;
        <T1, T2>(arg1: T1, arg2: T2): boolean;
        <T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3): boolean;
        <T1, T2, T3, T4>(arg1: T1, arg2: T2, arg3: T3, arg4: T4): boolean;
        <T1, T2, T3, T4, T5>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5
        ): boolean;
        <T1, T2, T3, T4, T5, T6>(
            arg1: T1,
            arg2: T2,
            arg3: T3,
            arg4: T4,
            arg5: T5,
            arg6: T6
        ): boolean;
    }

    interface IMemoizeOptions<TResult> {
        load: IMemoizableFunction<TResult>;
        hash: IHashingFunction;

        itemMaxAge?: IItemMaxAgeFunction<TResult>;
        bypass?: IBypassFunction;

        clone?: boolean;
        freeze?: boolean;
        stale?: boolean;

        max?: number;
        maxAge?: number;
        length?: number;

        dispose?: (key: string, value: TResult) => void;
    }

    interface IMemoizeOptionsSync<TResult> extends IMemoizeOptions<TResult> {
        load: IMemoizableFunctionSync<TResult>;
    }

    interface IMemoizer {
        <TResult>(params: IMemoizeOptions<TResult>): IMemoized<TResult>;
        sync: <TResult>(
            params: IMemoizeOptionsSync<TResult>
        ) => IMemoizedSync<TResult>;
    }

    const memoize: IMemoizer;
    export = memoize;
}
