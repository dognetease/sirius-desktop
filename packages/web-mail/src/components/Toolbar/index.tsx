// import { Menu, Tooltip } from 'antd';
//
// const Toobar: React.FC<{mark,readStatus,fid?:number}> = ({
//     mark,
//     readStatus,
//     fid
// }) => {
//     const menu = ()=>{
//         return <Menu>
//             {(fid == 2 || fid == 17 || fid == 19) ? '':<Menu.Item key="1-1" onClick={handleMove}>移动</Menu.Item>}
//             {(fid && fid >= 2 && fid <= 5)?'':
//             <Menu.Item key="1-2" onClick={()=>handleRemark(null,readStatus=='unread','read')}>{readStatus=='read'?'标为未读':'标为已读'}</Menu.Item>}
//         </Menu>
//     }
//     return (
//         <div className="u-tool">
//             {(fid == 2 || fid == 3)?
//                 <div className="u-tool-group">
//                     <Tooltip title="重新编辑" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                         <div className="u-tool-btn" onClick={()=>handleEdit()}>
//                             <ReadListIcons.EditSvg></ReadListIcons.EditSvg>
//                         </div>
//                     </Tooltip>
//                     <div className="u-tool-line">
//                         <div className="line"></div>
//                     </div>
//                 </div>:''
//             }
//             {(fid == 2)?'':
//                 <div className="u-tool-group">
//                     <Tooltip title="回复" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                         <div className="u-tool-btn" onClick={()=>handleApply(false)}>
//                             <ReadListIcons.ReplySvg></ReadListIcons.ReplySvg>
//                         </div>
//                     </Tooltip>
//                     <Tooltip title="回复全部" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                     <div className="u-tool-btn" onClick={()=>handleApply(true)}>
//                         <ReadListIcons.ReplyAllSvg></ReadListIcons.ReplyAllSvg>
//                     </div>
//                     </Tooltip>
//
//                     <Tooltip title="转发" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                     <div className="u-tool-btn" onClick={()=>handleReward()}>
//                         <ReadListIcons.TransmitSvg></ReadListIcons.TransmitSvg>
//                     </div>
//                     </Tooltip>
//                 </div>
//             }
//             {(fid == 4 || fid ==5)?'':
//                 mark =='redFlag'?
//                 <Tooltip title="取消红旗" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                     <div className="u-tool-btn" onClick={()=>handleRemark(null,false,'redFlag')}>
//                         <ReadListIcons.RedFlagSvg></ReadListIcons.RedFlagSvg>
//                     </div>
//                 </Tooltip>
//                 :
//                 <Tooltip title="标为红旗" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                     <div className="u-tool-btn" onClick={()=>handleRemark(null,true,'redFlag')}>
//                         <ReadListIcons.FlagSvg></ReadListIcons.FlagSvg>
//                     </div>
//                 </Tooltip>
//             }
//             {
//             fid == 4?
//             <Tooltip title="彻底删除" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                 <div className="u-tool-btn" onClick={handleDelete}>
//                     <ReadListIcons.RecycleSvg></ReadListIcons.RecycleSvg>
//                 </div>
//             </Tooltip>:
//             <Tooltip title="删除" mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
//                 <div className="u-tool-btn" onClick={handleDelete}>
//                     <ReadListIcons.RecycleSvg></ReadListIcons.RecycleSvg>
//                 </div>
//             </Tooltip>
//             }
//             {fid == 2?'':
//             <Dropdown
//                     overlayClassName = "u-tree-dropmenu"
//                     overlay={menu}
//                     trigger={['contextMenu']}
//                 >
//             <div className="u-tool-btn">
//                 <ReadListIcons.MoreSvg></ReadListIcons.MoreSvg>
//             </div>
//             </Dropdown>
//             }
//         </div>
//         )
// }
