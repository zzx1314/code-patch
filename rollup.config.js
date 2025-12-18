import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import path from 'path';

export default {
  input: 'src/webview/vendor-entry.js', // 我们稍后创建这个文件，用于引入 marked 和 highlight.js
  output: {
    file: 'src/webview/vendor.bundle.js', // 打包后的文件
    format: 'iife', // 自执行函数，适合在浏览器环境使用
    name: 'vendor'
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs()
  ]
};
