// export function serveStatic(root) {
//     return (req, res, next) => {
//         const path = req.url;
//         const filePath = path.startsWith('/') ? path.slice(1) : path;
//         const fullPath = path.join(root, filePath);
//         fs.stat(fullPath, (err, stats) => {
//             if (err) {
//                 return next();
//             }
// }