import {
      PlatformFactory, PlatformType, Plugin,
} from "../interfaces";

export const getPlatfom: PlatformFactory = () => {
    const context: {
        plugins: Plugin[],
        initialized: boolean,
        middleWares: any[];
    } = {
        plugins: [],
        initialized: false,
        middleWares: [],
    };
    const publicContext: any = {
        name: "frontend-platform",
        type: PlatformType.frontend,
        version: "0.0.1",
        addMiddleWare: (middleWareParams: any) => {
            context.middleWares.push(middleWareParams);
        },
    };

    const addPlugins = async (plg: Plugin[]) => {
        const { initialized, plugins } = context;
        if (initialized) {
            return  Promise.reject();
        }
        plugins.push(...plg);
    };

    const initialize = async () => {
        const { plugins } = context;
        for (const plugin of plugins) {
            await plugin.initialize(publicContext);
        }
        context.initialized = true;
    };

    const getContent = async () => {
        const { middleWares } = context;
        const initialData = {
            statusCode: 200,
            html: "",
        };

        middleWares.sort((a, b) => {
            return a.order - b.order;
        });

        return middleWares
          .map(({ order, middleWare}) => middleWare)
          .reduce((acc, res) => {
              return acc.then(res);
          }, Promise.resolve(initialData));
    };
    return {
      addPlugins,
      initialize,
      getContent,
    };
};