export function AppTitleBar({ leading, title, trailing, backgroundColor, center, style, tabHeight, hideBanner, statusTint }: {
    leading: any;
    title: any;
    trailing: any;
    backgroundColor: any;
    center: any;
    style: any;
    tabHeight: any;
    hideBanner: any;
    statusTint: any;
}): import("react/jsx-runtime").JSX.Element;
export namespace commonAppBarStyle {
    namespace flexer {
        let flex: number;
    }
    namespace main {
        let flex_1: number;
        export { flex_1 as flex };
        export let backgroundColor: import("../styling").CustomValue;
    }
    namespace mainThick {
        let flex_2: number;
        export { flex_2 as flex };
        let backgroundColor_1: import("../styling").CustomValue;
        export { backgroundColor_1 as backgroundColor };
    }
    namespace screenTitle {
        let fontSize: number;
        let fontWeight: string;
    }
    namespace screenTitleDes {
        export let color: any;
        let fontSize_1: number;
        export { fontSize_1 as fontSize };
        export let marginTop: number;
    }
    namespace titleBarIcon {
        let margin: number;
        let width: number;
        let height: number;
        let tintColor: import("../styling").CustomValue;
    }
    namespace tabbarBtnLeft {
        let paddingLeft: number;
    }
    namespace tabbarBtnRight {
        let paddingRight: number;
    }
}
