import {
	BlockOutlined,
	CloseCircleOutlined,
	DeleteRowOutlined,
	HeartOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import {
	DndContext,
	PointerSensor,
	closestCenter,
	useSensor,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	horizontalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown, MenuProps, Tabs, theme } from "antd";
import { cloneDeep } from "lodash-es";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocationListen } from "src/common/hooks";
import { ROUTE_ID } from "src/router/name";
import { ROUTE_ID_KEY } from "src/router/types";
import { AppHelper, RouterHelper, useFlat } from "src/service";
import styles from "./index.module.scss";

interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
	"data-node-key": string;
}

const DraggableTabNode = ({
	className,
	zIndex,
	path,
	currentId,
	...props
}: DraggableTabPaneProps & {
	zIndex: number;
	path: string;
	currentId: React.MutableRefObject<string | undefined>;
}) => {
	const {
		token: { colorBgLayout },
	} = theme.useToken();
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({
			id: props["data-node-key"],
		});
	const style: React.CSSProperties = {
		...props.style,
		transform: CSS.Translate.toString(transform),
		transition,
		cursor: "move",
	};
	let routeId = path.split("/").slice(-1)[0];

	let cacheComp = AppHelper.getKeepAliveComponentById({
		id: routeId,
	});

	if (currentId.current == path && cacheComp && transform!?.y > 50) {
		return (
			<div
				style={{
					...style,
					width: "200px",
					zIndex: 2,
				}}
				ref={setNodeRef}
				{...listeners}
				{...attributes}
			>
				<Tabs
					className={styles.test}
					type="card"
					items={[
						{
							label: routeId,
							key: routeId,
						},
					]}
				/>
				<div
					style={{
						width: "60vw",
						opacity: "initial",
						position: "relative",
						top: "-20px",
						background: colorBgLayout,
						padding: "20px",
						borderRadius: "12px",
						height: "50vh",
						overflow: "auto",
					}}
				>
					{cacheComp}
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				...style,
				zIndex,
			}}
			ref={setNodeRef}
			{...listeners}
			{...attributes}
		>
			{props.children}
		</div>
	);
};

const App: React.FC = () => {
	const { t } = useTranslation();
	const {
		setTabItems,
		setActiveTabKey,
		activeTabKey,
		tabItems,
		language,
		setRefreshKey,
	} = useFlat("appStore");
	const currentTabRef = useRef<string>();
	const [tabClassName, setTabClassName] = useState("");
	const currentDragRef = useRef<string>();
	const sensor = useSensor(PointerSensor, {
		activationConstraint: { distance: 10 },
	});

	useEffect(() => {
		window.addEventListener('', function (event) {
			// event.state 包含 pushState 方法设置的状态对象
			if (event.state) {
				// 在这里执行与状态变化相关的操作
				console.log("URL 发生了变化，新的状态对象为：", event.state);
			}
		});
	}, []);
	useLocationListen(
		(location) => {
			const tabItemsTemp = cloneDeep(tabItems).filter((item) => {
				return item;
			});
			if (
				![ROUTE_ID.NotFundPage, ROUTE_ID.LoadingPage].includes(
					RouterHelper.getRouteIdByPath(location.pathname),
				)
			) {
				const { pathname } = location;
				const id = pathname.split("/").slice(-1)[0];
				if (
					!tabItems.some((item) => {
						return (
							item.location?.pathname.toLocaleLowerCase() ==
							location.pathname.toLocaleLowerCase()
						);
					})
				) {
					tabItemsTemp.push({
						location,
						label:
							RouterHelper.getRouteTitleByKey(
								id as ROUTE_ID_KEY,
							) || "",
						key: location.pathname,
					});
				} else {
					let targetIndex = tabItems.findIndex((item) => {
						return item.key === location.pathname;
					});
				}
			}
			let temp = tabItemsTemp.map((item) => {
				if (item.label) {
					item.label = t(item.label);
				}
				return item;
			});
			setTabItems(temp);
			setActiveTabKey(location.pathname);
		},
		[language],
	);
	const onDragEnd = ({ active, over }: DragEndEvent) => {
		setTabClassName(styles.test);
		const { rect } = active;
		const { current } = rect;
		const { top, left } = current.translated!;
		if (top > 130) {
			AppHelper.addWinbox({
				content: AppHelper.getKeepAliveComponentById({
					id: (active.id as string).split("/").slice(-1)[0],
				}),
				pos: {
					x: left,
					y: top,
				},
				title: active.id as string,
				type: "page",
			});
			AppHelper.closeTabByPath({
				pathName: active.id as string,
			});

			return;
		}
		currentDragRef.current = undefined;
		if (!over) return;
		const tabsHistoryTemp = [...tabItems];
		const activeIndex = tabsHistoryTemp.findIndex(
			(i) => i.key === active.id,
		);
		const overIndex = tabsHistoryTemp.findIndex((i) => i.key === over?.id);
		setTabItems(arrayMove(tabsHistoryTemp, activeIndex, overIndex));
	};
	const items: MenuProps["items"] = useMemo(() => {
		return [
			{
				label: (
					<a
						onClick={(e) => {
							e.preventDefault();
							if (currentTabRef.current === location.pathname) {
								RouterHelper.jumpTo(ROUTE_ID.LoadingPage);
							}
							currentTabRef.current &&
								setRefreshKey([
									currentTabRef.current
										.split("/")
										.slice(-1)[0],
								]);
						}}
					>
						Refesh
					</a>
				),
				key: "0",
				icon: <ReloadOutlined />,
			},
			{
				label: <a href="https://www.aliyun.com">Favourite</a>,
				key: "1",
				icon: <HeartOutlined />,
			},
			{
				label: <a href="https://www.aliyun.com">Float</a>,
				icon: <BlockOutlined />,
				key: "3",
			},
			{
				label: <a href="https://www.aliyun.com">Close Right</a>,
				icon: <DeleteRowOutlined />,
				key: "4",
			},
			{
				label: <a href="https://www.aliyun.com">Close Other</a>,
				icon: <CloseCircleOutlined />,
				key: "5",
			},
		];
	}, []);

	const onEdit = (
		targetKey: React.MouseEvent | React.KeyboardEvent | string,
		action: "add" | "remove",
	) => {
		if (action === "remove") {
			AppHelper.closeTabByPath({
				pathName: targetKey as string,
			});
		}
	};

	return (
		<Tabs
			className={tabClassName}
			style={{
				width: "100%",
				height: "40px",
				zIndex: 2,
			}}
			onEdit={onEdit}
			tabBarGutter={2}
			type="editable-card"
			indicator={{ size: (origin) => origin - 20, align: "center" }}
			items={tabItems.map((item) => {
				return {
					...item,
					key: item.key,
				};
			})}
			hideAdd
			activeKey={activeTabKey}
			onChange={(e) => {
				setActiveTabKey(e);
				let target = tabItems.find((item) => {
					return item.key === e;
				});
				if (target) {
					RouterHelper.jumpToByPath(
						e + target.location?.search + target.location?.hash,
					);
				} else {
					RouterHelper.jumpToByPath(e);
				}
			}}
			renderTabBar={(tabBarProps, DefaultTabBar) => (
				<DndContext
					collisionDetection={closestCenter}
					onDragStart={({ active }) => {
						currentDragRef.current = active.id as string;
						setTabClassName(styles.content);
						let target = tabItems.find((item) => {
							return item.key === currentDragRef.current;
						});
						if (target) {
							RouterHelper.jumpToByPath(
								currentDragRef.current +
									target.location?.search +
									target.location?.hash,
							);
						} else {
							RouterHelper.jumpToByPath(currentDragRef.current);
						}
					}}
					sensors={[sensor]}
					onDragEnd={onDragEnd}
				>
					<SortableContext
						items={tabItems.map((i) => i.key)}
						strategy={horizontalListSortingStrategy}
					>
						<DefaultTabBar {...tabBarProps}>
							{(node) => {
								return (
									<DraggableTabNode
										{...node.props}
										zIndex={
											tabBarProps.activeKey == node.key
												? 1
												: 0
										}
										currentId={currentDragRef}
										path={node.key}
										key={node.key}
									>
										<Dropdown
											onOpenChange={(open) => {
												if (open) {
													currentTabRef.current =
														node.key!;
												} else {
													currentTabRef.current =
														undefined;
												}
											}}
											menu={{
												items,
											}}
											trigger={["contextMenu"]}
										>
											{node}
										</Dropdown>
									</DraggableTabNode>
								);
							}}
						</DefaultTabBar>
					</SortableContext>
				</DndContext>
			)}
		/>
	);
};

export default App;
