# [1.1.0](https://github.com/danielmontes9/md2jira-previewer/compare/v1.0.1...v1.1.0) (2026-03-28)


### Bug Fixes

* **web:** improve responsive layout across all breakpoints ([7fff025](https://github.com/danielmontes9/md2jira-previewer/commit/7fff0255f8a5a485d55ba10cadfc068063e3f941))


### Features

* **web:** add Buy Me a Coffee support button ([e59dffb](https://github.com/danielmontes9/md2jira-previewer/commit/e59dffbcf6170de61a84afa519c55d8156df4a63))
* **web:** move import/export buttons to markdown panel header ([8be21d1](https://github.com/danielmontes9/md2jira-previewer/commit/8be21d146fd111cef4125dff7ee3d3d85aa5e75c))


### Performance Improvements

* **web:** reduce LCP 64% via memoization, lazy assets and code splitting ([f094a33](https://github.com/danielmontes9/md2jira-previewer/commit/f094a33da4237150ca70ad8f657e43176126f102))

## [1.0.1](https://github.com/danielmontes9/md2jira-previewer/compare/v1.0.0...v1.0.1) (2026-03-26)


### Bug Fixes

* **ci:** resolve typecheck errors in CI ([775b8ab](https://github.com/danielmontes9/md2jira-previewer/commit/775b8ab2de9933bb32851a0ba3144ec587f63168))
* **core:** export additional ADF node types and fix implicit any in JiraOutput ([b64262f](https://github.com/danielmontes9/md2jira-previewer/commit/b64262f2da6691db477644fa51abad10cef72212))

# 1.0.0 (2026-03-26)


### Bug Fixes

* **ci:** add browser globals to ESLint config for apps/web ([bacf2b1](https://github.com/danielmontes9/md2jira-previewer/commit/bacf2b194303a8085efe6c37c4af79a55f6dc9f7))
* **ci:** install semantic-release plugins as devDependencies ([1470def](https://github.com/danielmontes9/md2jira-previewer/commit/1470defaac94cc9450bf14efe514b4b9c83b8193))
* **ci:** use **/*.config.{js,ts} pattern in ESLint ignores ([4becb91](https://github.com/danielmontes9/md2jira-previewer/commit/4becb91d148661058e3511a2629ab86bf460ddf0))
* **tables:** use Jira-standard table format without padding spaces ([d2c49ac](https://github.com/danielmontes9/md2jira-previewer/commit/d2c49ac91bb1acbd0c43a7b61bdffc8c9562d00a))


### Features

* **core:** add Atlassian Document Format (ADF) converter ([18e07c1](https://github.com/danielmontes9/md2jira-previewer/commit/18e07c15d27e9734d511190bf920ca9ab9e4fc0f))
* **core:** implement full Markdown to Jira conversion pipeline ([b08f461](https://github.com/danielmontes9/md2jira-previewer/commit/b08f46136496c17258745598ce0c361fe7abb4b7))
* **web:** add format toggle for Wiki Markup and ADF output ([5dfce01](https://github.com/danielmontes9/md2jira-previewer/commit/5dfce0180243500b4e81fac12497fa5aa11c4c96))
* **web:** add light and dark mode with theme toggle ([4ee050b](https://github.com/danielmontes9/md2jira-previewer/commit/4ee050b5d42b23fddcc44918f018c8b567bb6822))
* **web:** add Preview/Code view toggle in output panel ([548f0f4](https://github.com/danielmontes9/md2jira-previewer/commit/548f0f40efe62f61fd0d157d242c1e58345dda16))
* **web:** improve SEO with meta tags, Open Graph, and structured data ([875e3bd](https://github.com/danielmontes9/md2jira-previewer/commit/875e3bd7009c8cbf2049926f54c9d3dc114ec325))
