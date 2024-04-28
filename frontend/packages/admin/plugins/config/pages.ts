//@ts-ignore
import { lazy } from "react";

const MdPage = lazy(
	() =>
		import(
			"plugins/moderate-plugin-markdown/pages/HomePage/CmsPage/MdPage"
		),
);
const WinboxPage = lazy(
	() =>
		import(
			"plugins/moderate-plugin-winbox/pages/HomePage/CmsPage/WinboxPage"
		),
);
const PdfPage = lazy(
	() => import("plugins/moderate-plugin-pdf/pages/HomePage/CmsPage/PdfPage"),
);
const MusicPage = lazy(
	() =>
		import(
			"plugins/moderate-plugin-music/pages/HomePage/CmsPage/MusicPage"
		),
);
const RivePage = lazy(
	() =>
		import("plugins/moderate-plugin-rive/pages/HomePage/CmsPage/RivePage"),
);
//>>>PAGE_INPORT_SIGN<<<//

export const pageList = {
	MdPage,
	WinboxPage,
	PdfPage,
	MusicPage,
	RivePage,
	//>>>PAGE_SIGN<<<//
};
