## [2.4.5](https://github.com/danielmontes9/md2jira/compare/v2.4.4...v2.4.5) (2026-05-30)


### Performance Improvements

* **web:** split codemirror and remark into separate chunks ([81d34ba](https://github.com/danielmontes9/md2jira/commit/81d34ba79374eca4361cfe6ab8979dac76f22891))

## [2.4.4](https://github.com/danielmontes9/md2jira/compare/v2.4.3...v2.4.4) (2026-05-30)


### Bug Fixes

* **web:** stripTags now removes script/style content, not just tags ([a6982d3](https://github.com/danielmontes9/md2jira/commit/a6982d34e7434a44fd568ddb6fb06f9924a70651))

## [2.4.3](https://github.com/danielmontes9/md2jira/compare/v2.4.2...v2.4.3) (2026-05-30)


### Bug Fixes

* **cli:** resolve 6 failing CLI tests ([4688000](https://github.com/danielmontes9/md2jira/commit/4688000c41a9d8710dc9b4c4cadeaae40bf4eea4))

## [2.4.2](https://github.com/danielmontes9/md2jira/compare/v2.4.1...v2.4.2) (2026-05-30)


### Bug Fixes

* **web:** resolve 16 failing tests in apps/web test suite ([134f36c](https://github.com/danielmontes9/md2jira/commit/134f36c49146283bd7c5df20cdd4ffbeadd77649))

## [2.4.1](https://github.com/danielmontes9/md2jira/compare/v2.4.0...v2.4.1) (2026-05-30)


### Bug Fixes

* **web:** resolve all ESLint errors and warnings for CI lint step ([ec76b52](https://github.com/danielmontes9/md2jira/commit/ec76b52b39a23c7b1160edceaa294b7188dcfb6d))

# [2.4.0](https://github.com/danielmontes9/md2jira/compare/v2.3.0...v2.4.0) (2026-05-30)


### Bug Fixes

* **web:** align optional prop types and fix useOutputConversion call signature ([420fa9a](https://github.com/danielmontes9/md2jira/commit/420fa9af60ed6a158b09e44eb539ab460e4ca6f1))
* **web:** use AbortController for event cleanup and improve ADF worker error handling ([946c4a7](https://github.com/danielmontes9/md2jira/commit/946c4a7be04dfd80cfe6322f9c745a97de2217db))


### Features

* **core:** implement image conversion for Wiki Markup, ADF, and Confluence ([4cb2cd4](https://github.com/danielmontes9/md2jira/commit/4cb2cd47330761c0620211a9762cfc2bb2433d93))
* **web:** add base URL setting for relative link resolution ([d3df6c5](https://github.com/danielmontes9/md2jira/commit/d3df6c58203087e6433e92095e6012ea54f660cc))
* **web:** add BrokenImage NodeView with broken-image placeholder and export AlignedTable extensions ([4a08152](https://github.com/danielmontes9/md2jira/commit/4a08152a0926c3769f750c53e95f2a1baae4310a))
* **web:** add Confluence edit mode and wiki-to-markdown sync ([33d501f](https://github.com/danielmontes9/md2jira/commit/33d501f1d3b958ec1a99423d31f885d7a3ddeb88))
* **web:** add German locale and expand i18n keys for new features ([fcc5853](https://github.com/danielmontes9/md2jira/commit/fcc5853fbe587703a1c5b7c3356775d59b0b577b))
* **web:** add history diff viewer, bulk delete confirmation, and autosave indicator ([a509c71](https://github.com/danielmontes9/md2jira/commit/a509c71506a828973ea3ec153f48634d4d4b0988))
* **web:** add Note, Warning, and Success WYSIWYG insert panels ([bab743c](https://github.com/danielmontes9/md2jira/commit/bab743cedcfcf8771f4805c8743fbe644d73e9db))
* **web:** add tiptap doc-tree serializer with OWASP A03 URL guards ([d86efa0](https://github.com/danielmontes9/md2jira/commit/d86efa010aa4314f1e3495709a4a31e386b81da2))
* **web:** Alt+N opens new-document modal; guard editor on clearHistory ([5e9f548](https://github.com/danielmontes9/md2jira/commit/5e9f54885e50d779c0d078084f99cdd6a9fe96fa))
* **web:** animated modal exit with ModalCloseButton and ConfirmModal ([d351ecd](https://github.com/danielmontes9/md2jira/commit/d351ecd2da064a47e9e42d8e23001a61a0418c81))
* **web:** HistorySidebar — bulk-delete, rename, diff view, SIDEBAR_CLOSE_MS ([ba42cd5](https://github.com/danielmontes9/md2jira/commit/ba42cd5e9077ac58dd7543c15df634c29c496563))
* **web:** new-document modal with name input and newDocumentTrigger prop ([71220ad](https://github.com/danielmontes9/md2jira/commit/71220ad4c312bdb4a7a280b37c6d01058c0c0a89))
* **web:** render ADF mediaSingle images and update CSP for external images ([db3d1db](https://github.com/danielmontes9/md2jira/commit/db3d1db67d05e6a6f7a2ba5f6843f899caee5dfb))
* **web:** show warning toast when document exceeds URL-sharing limit ([402edd7](https://github.com/danielmontes9/md2jira/commit/402edd76b0aee8b81fb3750e5cc4c1d107caca62))
* **web:** useDocumentHistory — rename, deleteEntries, saveContent, lastSavedAt ([75fbb0b](https://github.com/danielmontes9/md2jira/commit/75fbb0b59764cd452b0f9923b43cd1dfd85ef431))

# [2.3.0](https://github.com/danielmontes9/md2jira/compare/v2.2.0...v2.3.0) (2026-05-29)


### Features

* **web:** add XML syntax highlighter for Confluence output ([8eddbe5](https://github.com/danielmontes9/md2jira/commit/8eddbe569e1abd56f6612fb7ee5144293f9561e1))
* **web:** apply XML syntax highlighting to Confluence code view ([0d25228](https://github.com/danielmontes9/md2jira/commit/0d252285f4b43f351518368b9c01042349e33f73))

# [2.2.0](https://github.com/danielmontes9/md2jira/compare/v2.1.0...v2.2.0) (2026-05-29)


### Bug Fixes

* **core:** split escapeHtml/escapeXml; Confluence uses XML escaping for > ([5c42500](https://github.com/danielmontes9/md2jira/commit/5c42500f5a66ae976789a13429128123443405bb))
* **web:** defensive inline node fallback in adf-renderer; persist confluence fmt URL ([2ced960](https://github.com/danielmontes9/md2jira/commit/2ced960b500627fac8849d19b582ce0b2af5010d))
* **web:** refactor MarkdownInput timer callbacks and sanitize guard for V8 coverage accuracy ([687e14c](https://github.com/danielmontes9/md2jira/commit/687e14c57a620c6b99fec302fe1a4d493b2395df))


### Features

* **cli:** add --format confluence support, update description, add trailing newline to output ([c768d1f](https://github.com/danielmontes9/md2jira/commit/c768d1f89d127a7cca8129f376f2efc55bde406e))
* **cli:** add --watch / -w flag to re-run conversion on file change ([d626b08](https://github.com/danielmontes9/md2jira/commit/d626b082a2ef84e6edf889d40741a929a72be92e))
* **cli:** use commander InvalidArgumentError for --format validation with case-insensitive normalisation ([db3be4a](https://github.com/danielmontes9/md2jira/commit/db3be4a33fb457c43a69e009e5652cc4c8af0e24))
* **core:** add convertToConfluence() — Confluence Storage Format converter ([195184e](https://github.com/danielmontes9/md2jira/commit/195184e7408e91dada20c56666dcf67b5cb50a0c))
* **core:** add language alias map, semantic table thead/tbody, and --quiet flag ([a4bf489](https://github.com/danielmontes9/md2jira/commit/a4bf48992b5cbb449e05e039035f0cb3d955f1d3))
* **web:** add 100-entry option to max history size setting ([bf02f9a](https://github.com/danielmontes9/md2jira/commit/bf02f9a7f3a2f7b9b326db23a1dfaae4ca0251af))
* **web:** add onImportSuccess callback to HistorySidebar and historyImportSuccess i18n key ([4e05068](https://github.com/danielmontes9/md2jira/commit/4e05068a7dc1ac42f8404afa3b63e3ef2711e6d1))
* **web:** extend OutputFormat type to include 'confluence' ([898f617](https://github.com/danielmontes9/md2jira/commit/898f61727f90e01815e85876ea3a6c71fe428803))
* **web:** wire Confluence format end-to-end in the UI ([80d6aa6](https://github.com/danielmontes9/md2jira/commit/80d6aa6c53c9bb82faf643e00f3babad96591151))

# [2.1.0](https://github.com/danielmontes9/md2jira/compare/v2.0.0...v2.1.0) (2026-05-24)


### Features

* **web:** expand i18n catalog with WYSIWYG, a11y, and shortcut labels ([bfb359b](https://github.com/danielmontes9/md2jira/commit/bfb359bd9f7390aaa76b9dd045981ca4d7ce84b9))

# [2.0.0](https://github.com/danielmontes9/md2jira/compare/v1.4.1...v2.0.0) (2026-05-24)


* feat(web)!: migrate WYSIWYG editor from execCommand to TipTap ([e44c697](https://github.com/danielmontes9/md2jira/commit/e44c69745608d861ab90154841b1b8c7b23ac96c))


### Bug Fixes

* **ci:** run pnpm test:all to include web tests ([48a370c](https://github.com/danielmontes9/md2jira/commit/48a370c33c41d2b88aefa782f666a40a17de3a85))
* **cli:** deduplicate --disable transforms; bump v0.2.0; test edge cases ([a012f85](https://github.com/danielmontes9/md2jira/commit/a012f85a2170484b4345b7343d675ea1fe5bd31a))
* **cli:** resolve exactOptionalPropertyTypes error and correct --disable test expectation ([c10d980](https://github.com/danielmontes9/md2jira/commit/c10d98083f68360584588dccd9bf3a48232b21b0))
* **e2e:** replace waitForTimeout with deterministic waits in visual tests ([39d1996](https://github.com/danielmontes9/md2jira/commit/39d199651cece696bb9b5e2dd13b08ddd91c58a0))
* lazy-load DOMPurify, add web-vitals catch, Escape closes toolbar, raise coverage thresholds, 3 E2E WYSIWYG tests ([d585842](https://github.com/danielmontes9/md2jira/commit/d585842c3f52bbbbda26aabbdc9e00bb3d6e83bd))
* resolve architectural risks and apply quality improvements ([c141564](https://github.com/danielmontes9/md2jira/commit/c141564ec8e25eb483548245f9479a4d9940edd3))
* **tables:** escape pipe characters outside Jira link brackets in cells ([b55f8c6](https://github.com/danielmontes9/md2jira/commit/b55f8c64e8810e8cab485293e3c3b792487d59c9))
* **tables:** prevent double-escaping of {{inline code}} inside table cells ([ab59603](https://github.com/danielmontes9/md2jira/commit/ab596032ac153a3aa701d756dc2967a81cb5711b))
* **web:** add .js extension to Modal imports in InfoModal and ShortcutsModal ([6e9d934](https://github.com/danielmontes9/md2jira/commit/6e9d934b16c3905a1b751489a408a15fcb331149))
* **web:** add accessible aria-label to all toolbar dropdown triggers and type=button to menu buttons ([1770455](https://github.com/danielmontes9/md2jira/commit/17704551ef24dc8265c68fc506beae43843a4630))
* **web:** add aria-haspopup=dialog to Info button in Header ([6c42a26](https://github.com/danielmontes9/md2jira/commit/6c42a2648c37ed7792e4138106b0bfbbfac0a84e))
* **web:** add aria-haspopup=dialog to Shortcuts button and fix Copy button aria ([27f88b1](https://github.com/danielmontes9/md2jira/commit/27f88b1eddd11e3fb486b34f73386238f1e5b308))
* **web:** add aria-live to spinner and create Playwright E2E smoke tests ([ab482db](https://github.com/danielmontes9/md2jira/commit/ab482db44fb7c760fbf22054916ad8debcb112f4))
* **web:** add data-type attribute to DECISION_PANEL_HTML template ([2802b9f](https://github.com/danielmontes9/md2jira/commit/2802b9f72a95f38fccd4fcf4b684d775d0ec36f2))
* **web:** add focus-visible outline to all interactive elements for WCAG 2.4.7 ([83b2be4](https://github.com/danielmontes9/md2jira/commit/83b2be4b7b0d1db112d17cd551275bf17ddd89f3))
* **web:** add Shift+Tab dedent entry to shortcuts modal ([405863e](https://github.com/danielmontes9/md2jira/commit/405863eb5aa96663bcded9ceac99aea70dc11509))
* **web:** add skip-link, main aria-label, and aria-label on toolbar standalone buttons ([0194242](https://github.com/danielmontes9/md2jira/commit/01942421fdcf24fa0484980db6d0bb4f16ea69a7))
* **web:** add tabindex=-1 to task list checkboxes; add task list renderer tests ([a821e85](https://github.com/danielmontes9/md2jira/commit/a821e85c4dc32d67cf0f6481633468562e4e7f05))
* **web:** apply inline highlights to bq., heading and list item content ([5d456cb](https://github.com/danielmontes9/md2jira/commit/5d456cb9b14b7097588c2d45ab2438fcf49565fb))
* **web:** clipboard error feedback, emoji dedup, misc fixes ([4d7d65e](https://github.com/danielmontes9/md2jira/commit/4d7d65ec3f9deb3b2e1fb972c6e03e08e9feff1d))
* **web:** complete test isolation migration and add aria-live copy announcement ([96f86a4](https://github.com/danielmontes9/md2jira/commit/96f86a4a86866bddfea7151824b6868dbd705dd0))
* **web:** correct [@layer](https://github.com/layer) cascade ordering; inline ProseMirror base styles ([dfc3d7c](https://github.com/danielmontes9/md2jira/commit/dfc3d7ca0046e05b5f9d0f621d911e1bc122559d))
* **web:** correct duplicate step-7 comment in applyInlineHighlights ([a9dc0f4](https://github.com/danielmontes9/md2jira/commit/a9dc0f41d380a8c2748f4c0dee994a6a026c8bb2))
* **web:** correct inline-code shortcut label from Shift+M to Shift+K in format menu ([35d728d](https://github.com/danielmontes9/md2jira/commit/35d728d6e4fcfe21b25af7738d6c218821e448cc))
* **web:** correct usePwaUpdate detection, add tests for useOfflineStatus + usePwaUpdate ([fc3193b](https://github.com/danielmontes9/md2jira/commit/fc3193b8eba087f52eb78aba18f7b14791e538a1))
* **web:** Ctrl+K inserts url placeholder pre-selected and announce format/viewMode changes via aria-live ([562abce](https://github.com/danielmontes9/md2jira/commit/562abce0310d3d701f6651ef9e49e000dc71cbc8))
* **web:** escape Markdown-special chars in tiptapDocToMarkdown plain text nodes ([5fe1a54](https://github.com/danielmontes9/md2jira/commit/5fe1a5494a84e2160d4a6330c761d4d80f9ee954))
* **web:** escape Markdown-special chars inside non-code marks in tiptapDocToMarkdown ([d8ead0e](https://github.com/danielmontes9/md2jira/commit/d8ead0e5b35504345525335d252c903d88a5824c))
* **web:** fix browser compat bugs, a11y, and add useMarkdownShortcuts tests  - Fix handleImport: append input to DOM before click (Safari/mobile support) - Fix handleExport: append anchor to DOM before click (Firefox support) - Move BTN_CLS and DROP_ITEM_CLS to module scope in EditorToolbar - Fix aria-haspopup from 'true' to 'menu' (WAI-ARIA semantics) - Add 26 tests for useMarkdownShortcuts hook: Tab, bold/italic/code/strikethrough   wraps, heading cycle (h1→h2→h3→none), bullet/numbered/blockquote toggles,   Enter list continuation and cancellation, Ctrl+Enter blank line, Alt+Arrow   line move, Ctrl+D duplicate line ([2b8be00](https://github.com/danielmontes9/md2jira/commit/2b8be00c84b960f9df8eed8a7536f519b95f3852))
* **web:** fix ColorMenu remove-color, task list via TipTap, turndown roundtrip, Modal AbortController, aria-labels ([3aeb26c](https://github.com/danielmontes9/md2jira/commit/3aeb26c79d02506d661b2e98eadbbda16e6b0c6c))
* **web:** fix tests — define execCommand before spying and narrow heading query ([5bbfc1d](https://github.com/danielmontes9/md2jira/commit/5bbfc1dfa5e602906ec55b861620a4bf7eb0a4c0))
* **web:** fix usePwaUpdate guard and flaky test stubs ([67c25f8](https://github.com/danielmontes9/md2jira/commit/67c25f88a11a5b034195753c9a8eca0132791707))
* **web:** gate web-vitals to DEV, grid toolbar animation, worker error handling ([310deeb](https://github.com/danielmontes9/md2jira/commit/310deeb470e85ed91f3fd4316c667579b2168742))
* **web:** guard handleCopyMd setState calls against unmounted component ([df7005e](https://github.com/danielmontes9/md2jira/commit/df7005e298753f0b5129e53e2c67b1468ff13499))
* **web:** guard root element; fix empty ?md= URL param; document export filename ([df8e15f](https://github.com/danielmontes9/md2jira/commit/df8e15fa58b5946ffc87cf2c6aaee86c0c9faa27)), closes [#root](https://github.com/danielmontes9/md2jira/issues/root)
* **web:** handle FileReader.onerror in useFileImportExport ([c355a76](https://github.com/danielmontes9/md2jira/commit/c355a76e5b33fa6527ccfc2bd87b1caa64393c9f))
* **web:** highlight wiki strikethrough tokens and Jira block macros ([92e2089](https://github.com/danielmontes9/md2jira/commit/92e2089bcc606aa2ab6eaa97414fc9253d43a53b))
* **web:** i18n all remaining hardcoded strings ([e336e26](https://github.com/danielmontes9/md2jira/commit/e336e262d89df5a95837e478a6306e06bfad31ea))
* **web:** include input in arrow-key navigation and insert bare @ for mention ([0a838f6](https://github.com/danielmontes9/md2jira/commit/0a838f6126558406d15ff564ae55e69235095444))
* **web:** isMountedRef guard prevents setState after unmount in useTiptapEditor ([401f9bc](https://github.com/danielmontes9/md2jira/commit/401f9bc01d94575a1bbc4bffb4c39df9b8e1cfdb))
* **web:** migrate test globals to vi.stubGlobal and add aria-describedby to textarea ([9364bff](https://github.com/danielmontes9/md2jira/commit/9364bff3228de8e185ac0a84a3cb1c1b97189d32))
* **web:** move misplaced imports to top of useTiptapEditor ([df7ea4a](https://github.com/danielmontes9/md2jira/commit/df7ea4ae2fa862ba33a6c4590b09d51acd8e186a))
* **web:** NavigatorUA interface, adf-renderer codeBlock, Toast portal, file size guard ([34844b1](https://github.com/danielmontes9/md2jira/commit/34844b1ed60ad02a88e87aa40607bfa63cd13e0e)), closes [TS#30581](https://github.com/TS/issues/30581)
* **web:** paste handler calls onChange directly instead of setRangeText ([f02d1a3](https://github.com/danielmontes9/md2jira/commit/f02d1a34f85b98338c3b954df3303fbf11b7c9a5))
* **web:** refactor useMarkdownShortcuts to call onChange directly instead of setRangeText+dispatch ([7026457](https://github.com/danielmontes9/md2jira/commit/7026457c41f8b41c55cf492940a11ae8519762b8))
* **web:** remove 'color' from HTML roundtrip note in Format menu ([942380b](https://github.com/danielmontes9/md2jira/commit/942380be9b070e8b06fb17bdd27da08c773d7b98))
* **web:** remove card borders and editor focus ring ([bcaaa08](https://github.com/danielmontes9/md2jira/commit/bcaaa08b2fba1688cc6538d9971326f1bf6f5a6f))
* **web:** remove dead code and harden utilities ([e946777](https://github.com/danielmontes9/md2jira/commit/e946777b6f9cc45cddf55fd8dea68ef310a9f6c6))
* **web:** remove duplicate worker-error alert; add onError hooks and ErrorBoundary tests ([69aae5f](https://github.com/danielmontes9/md2jira/commit/69aae5fd8225c5c8beb00402cc74a3a21fa2a3bd))
* **web:** remove eslint-disable from useDeepLink isDeepLinkActive memo ([a2739cf](https://github.com/danielmontes9/md2jira/commit/a2739cfcb045fc97d072b91b3d419901d5b12c3a))
* **web:** remove last as-cast, Tab closes dropdown, DOMPurify safe fallback, worker cancel flag ([e0c984b](https://github.com/danielmontes9/md2jira/commit/e0c984b07aa975b38c05442ad2c3ed5f9cb1a5d9))
* **web:** remove spinner flash on every keystroke for small documents ([e1cf1df](https://github.com/danielmontes9/md2jira/commit/e1cf1dfb8fa2cfcc9b03df718a70e43e7fdfe6f2))
* **web:** render underline marks, cap worker retries, fix e2e aria-labels ([b9bb49a](https://github.com/danielmontes9/md2jira/commit/b9bb49aec4ba956fe410e9246d3056bf4b9daa13))
* **web:** replace &lt;&gt; placeholder with clipboard emoji in decision panel template ([1c4d814](https://github.com/danielmontes9/md2jira/commit/1c4d81442f926185ababfa80369edd117b219730))
* **web:** resolve all 9 ESLint errors to make pnpm lint pass cleanly ([93d82e4](https://github.com/danielmontes9/md2jira/commit/93d82e441675d785f31a255564344e4a8e46906a))
* **web:** restore selection after toolbar button clicks ([29c27a3](https://github.com/danielmontes9/md2jira/commit/29c27a3a060cb70db0873e36cc06ea0159faed3f))
* **web:** return focus to trigger button when toolbar dropdown closes ([cebdf68](https://github.com/danielmontes9/md2jira/commit/cebdf68382dd0dc0131e4f5ccee164e04cdcea85))
* **web:** roving tabIndex on radiogroups, type=button on all buttons, test fmt URL param ([95c54b0](https://github.com/danielmontes9/md2jira/commit/95c54b0cd4cdfae411bedd1e46b721b235bb0b4c))
* **web:** security and robustness improvements in App and hooks ([81b9a5b](https://github.com/danielmontes9/md2jira/commit/81b9a5bd19adee398fad6f657b3fbd16e120d7df))
* **web:** selective auto-retry, ADF unknown-block fallback, adaptive debounce ([23ffecc](https://github.com/danielmontes9/md2jira/commit/23ffeccf098aaf909fa7b2514c8a7a411b0ae9a0))
* **web:** show success toast after file import via button, consistent with drag-and-drop ([41d9c2d](https://github.com/danielmontes9/md2jira/commit/41d9c2d5f8d4c688c649ce18d1521662d81f908d))
* **web:** SRP for useOfflineStatus, PWA update banner, Alt+Shift shortcuts, Copy link test ([a554895](https://github.com/danielmontes9/md2jira/commit/a554895dadc74467c380cfd7c71111fd75219b9f))
* **web:** style info-panel and decision-panel via CSS instead of stripped inline styles ([67ef8ca](https://github.com/danielmontes9/md2jira/commit/67ef8cac1c5fd2d58934934e953c346d11527e4b))
* **web:** subscribe to OS color-scheme changes in useTheme ([63a5037](https://github.com/danielmontes9/md2jira/commit/63a5037db458578e198e20ef88a0ebda65dc3383))
* **web:** suppress onUpdate while editor is non-editable; add regression tests ([db01eb3](https://github.com/danielmontes9/md2jira/commit/db01eb3fb1bed015de9461ae3cf6840829c72913))
* **web:** unique ids, load validation, i18n aria-labels, edge case tests ([e5e87d2](https://github.com/danielmontes9/md2jira/commit/e5e87d2ee43a301228f14032092148e3a5d6c336))
* **web:** use <label htmlFor> instead of <span> for Markdown panel title ([ddf9e92](https://github.com/danielmontes9/md2jira/commit/ddf9e929d88ddc4290268c00dc34b6d4c57a2d79))
* **web:** use deferredSearch as guard in EmojiMenu to prevent flash of all emojis during rapid typing ([dc28468](https://github.com/danielmontes9/md2jira/commit/dc28468531fb7e430782676c41a0445072cd3a04))
* **web:** use format-specific aria-label for code view region ([68d53f0](https://github.com/danielmontes9/md2jira/commit/68d53f076778f9459290b68136c752eab5d6efda))
* **web:** use menuitemcheckbox/aria-checked for stateful toolbar menu items ([3b83fcc](https://github.com/danielmontes9/md2jira/commit/3b83fcc62b131fbf3b730f742144ebf7545cf181))
* **web:** use radiogroup/radio ARIA pattern for output format and view-mode toggles ([d257097](https://github.com/danielmontes9/md2jira/commit/d257097c068cc016afd2055495308d2247f2a550))
* **web:** validate history import, i18n missing strings, confirmNew auto-dismiss ([7651271](https://github.com/danielmontes9/md2jira/commit/765127114331edaec623e625a12e0dbc0a9d88e2))
* **web:** worker 5s timeout, ErrorBoundary retryCount reset, wiki hint banner ([cc0472d](https://github.com/danielmontes9/md2jira/commit/cc0472d6a31b649783795a08b3883414d7cbf165))
* **web:** worker error UI, underline warning, CSS injection guard, split clamp ([9874bbf](https://github.com/danielmontes9/md2jira/commit/9874bbf189a0ad594281adf12decb557a319d8ed))


### Features

* **cli:** add --base-url and --disable flags with ConvertOptions ([a711cab](https://github.com/danielmontes9/md2jira/commit/a711cab9dd59c5b514fd31c246eb03198209dbfb))
* **cli:** add --format adf output option ([995c4d8](https://github.com/danielmontes9/md2jira/commit/995c4d87e01db78b0219b84f5a40b2b344fffd00))
* **cli:** validate --format and --base-url; support repeated --disable flags ([c9c2d44](https://github.com/danielmontes9/md2jira/commit/c9c2d4424e3470e979c960e0f0da297c90198785))
* **core): add subsup AdfMark type; fix(web:** render sub/sup marks in adf-renderer ([8d158e6](https://github.com/danielmontes9/md2jira/commit/8d158e62b944d24bd2aee264549b92dfeebe0045))
* **core:** add ConvertOptions with baseUrl and disableTransforms ([241ee0a](https://github.com/danielmontes9/md2jira/commit/241ee0af2540d3ea3f40f9e125c5d87699f2b9cb))
* **core:** add error recovery for unknown nodes in convertToAdf ([233e038](https://github.com/danielmontes9/md2jira/commit/233e038ec7914d6531293047b119171a9d366db9))
* **core:** add GFM Alert panels and precise ADF type improvements ([7b7007d](https://github.com/danielmontes9/md2jira/commit/7b7007d8ea91228a74038958e2a475932dd3fb7b))
* **core:** add task list (GFM - [x]) support in ADF converter ([b752b3f](https://github.com/danielmontes9/md2jira/commit/b752b3f5604bc5045ccb6d7737c822968db27fb8))
* **core:** add underline to AdfMark union type ([b5d9740](https://github.com/danielmontes9/md2jira/commit/b5d97408aed5affca0890ee4784c1117612a9744))
* **core:** export all ADF types from index.ts and add panel to disableTransforms ([814a455](https://github.com/danielmontes9/md2jira/commit/814a455856659cfd9e37c7c405be027e1cee0196))
* **core:** task list wiki markup, unique ADF localIds, nested blockquotes ([ab156a7](https://github.com/danielmontes9/md2jira/commit/ab156a701a8fe936b8766ae07abd284df217b484))
* **core:** unknown-node fallback, BOM stripping, transforms barrel un-deprecate ([b280d59](https://github.com/danielmontes9/md2jira/commit/b280d59ea842d10713cbac33777e5d3aadd155c1))
* **web:** 10 UX improvements — format persistence, icon fix, perf, style ([691939f](https://github.com/danielmontes9/md2jira/commit/691939f1d397ddc10ce32f2fe438f41b82955862))
* **web:** adaptive deep-link debounce, offline banner, multi-paragraph table cell serialization ([a400278](https://github.com/danielmontes9/md2jira/commit/a400278134b55a6551fe905f91b5990ea2f60f7d))
* **web:** add ADF panel node rendering with CSS for 6 panel types ([023d577](https://github.com/danielmontes9/md2jira/commit/023d577cefe62d7fadb9bfab9874733a9b80320c))
* **web:** add basic PWA support with vite-plugin-pwa ([8c9547c](https://github.com/danielmontes9/md2jira/commit/8c9547c51919b61e34795e01680592e5196fa276))
* **web:** add CodeMirror 6 editor with undo/redo/search and syntax highlight ([a5434fe](https://github.com/danielmontes9/md2jira/commit/a5434fe56ac3d71e7e25f113f36f74466cc5c3dd))
* **web:** add Ctrl+K link shortcut, wiki syntax highlighting, arrow-key toolbar nav, lazyNamed helper, deep-link indicator ([776d24e](https://github.com/danielmontes9/md2jira/commit/776d24e749988cdbb56d8601055539d3bfb28673))
* **web:** add custom SVG favicon ([ce3c479](https://github.com/danielmontes9/md2jira/commit/ce3c4798fe14670a69b63dfa884155ab13793acc))
* **web:** add DOMPurify sanitization to WYSIWYG innerHTML assignments ([4626c90](https://github.com/danielmontes9/md2jira/commit/4626c9064f3948c55ea2ad6f9a323932318ad96c))
* **web:** add Edit mode for Wiki Markup output with local draft state ([9b22ae1](https://github.com/danielmontes9/md2jira/commit/9b22ae171a9dd0c646ac586348802ef8408d1f15))
* **web:** add French locale and complete all i18n improvements ([7bbf81c](https://github.com/danielmontes9/md2jira/commit/7bbf81c07cbc7fc1e2c0397caa97b2f4975cee80))
* **web:** add i18n keys for ShortcutsModal, InfoModal, Header, and WYSIWYG toolbar ([1acfca7](https://github.com/danielmontes9/md2jira/commit/1acfca7e5bd48820427ac35a96659cfe02d8cac5))
* **web:** add i18n system with English and Spanish UI translations ([fec7274](https://github.com/danielmontes9/md2jira/commit/fec727483454335fb12a9bc482435f5882011b57))
* **web:** add info modal with project description and package links ([7944fb4](https://github.com/danielmontes9/md2jira/commit/7944fb476c6b6bf98090da286faef64f18fd860f))
* **web:** add inline token highlighting to wiki markup preview ([3dddcce](https://github.com/danielmontes9/md2jira/commit/3dddcce1ab00d6671a1845f205ba1c1723f6d362))
* **web:** add mobile panel tabs and desktop resize handle ([2fcbe74](https://github.com/danielmontes9/md2jira/commit/2fcbe7448173e004658128c39163757f8791cf01))
* **web:** add onError callback to ErrorBoundary ([0c7ab37](https://github.com/danielmontes9/md2jira/commit/0c7ab37571b1da2aba39075fbb401bed257969ec))
* **web:** add Portuguese locale and extend language selector to three locales ([700da1e](https://github.com/danielmontes9/md2jira/commit/700da1ed00dabe1c45bc259654bf39e3c852d713))
* **web:** add production error reporting via sendBeacon; redact ?md= param ([41114ec](https://github.com/danielmontes9/md2jira/commit/41114ecb06797cc9020635d67191cbe12781bfe0))
* **web:** add PWA PNG icons via assets-generator ([c41c2c3](https://github.com/danielmontes9/md2jira/commit/c41c2c31b9e8640e02db8fb906b9a8d62c0466a4))
* **web:** add PWA runtime caching for app shell and external assets ([2c23b19](https://github.com/danielmontes9/md2jira/commit/2c23b19e0e950c83933cf19aae6dc305a405befc))
* **web:** add rich-text paste support via Turndown ([e1c6948](https://github.com/danielmontes9/md2jira/commit/e1c6948c3797ebc3bbd8817d3705976735c21c60))
* **web:** add SettingsContext, document history sidebar, and Settings modal ([6ac7658](https://github.com/danielmontes9/md2jira/commit/6ac7658665db987ec31a42b3a5582937bd933dde))
* **web:** add sitemap.xml and Vite canonical URL plugin ([8e833f4](https://github.com/danielmontes9/md2jira/commit/8e833f434b580a3d50c8e0e90255a485103eeedd))
* **web:** add Star on GitHub pill to header ([57af6ef](https://github.com/danielmontes9/md2jira/commit/57af6ef16578c18f0ea7f6decd74350c065bb920))
* **web:** add word count to status bar, lower Markdown header breakpoint to 420px ([9b7b3a6](https://github.com/danielmontes9/md2jira/commit/9b7b3a6399f6d1cb2d8a4481f489cbc5ced7d70f))
* **web:** add WYSIWYG editor shortcuts to ShortcutsModal ([afb1db6](https://github.com/danielmontes9/md2jira/commit/afb1db60f1faf04b3a6243609d09ad3add8b9d30))
* **web:** apply 10-point architectural improvements ([4fd52fe](https://github.com/danielmontes9/md2jira/commit/4fd52fea0ca8a8aebdffa18a2fcd02528877f8ed))
* **web:** apply syntax highlight to wiki markup in code view ([8073c4d](https://github.com/danielmontes9/md2jira/commit/8073c4d97dfcae8417328a3813227408f0393d6e))
* **web:** apply useT() to ShortcutsModal, InfoModal, Header, and ContentMenus ([493d1c4](https://github.com/danielmontes9/md2jira/commit/493d1c4f9d70f4d0c27361ac4f785fe0edcb1ed4))
* **web:** aria-pressed on active toolbar items, emoji useDeferredValue, test coverage ([1a9c504](https://github.com/danielmontes9/md2jira/commit/1a9c504800a5fb07a80b1da349d88e8e7d7d2100))
* **web:** copy-link button, Alt+A/W format shortcuts, fix longMd test timing ([57fc879](https://github.com/danielmontes9/md2jira/commit/57fc879a1d753e6e232e02c719b19425b0bcf70e))
* **web:** emoji const, dropdown blur-close, insertHtml optional, active color, lazy TipTap, adfBlockToHtml test ([adebe14](https://github.com/danielmontes9/md2jira/commit/adebe14c60b97789a7d6aee8452561898340cedc))
* **web:** extract JiraOutputContent, add aria-live, worker retry, and idle callback fix ([782f981](https://github.com/danielmontes9/md2jira/commit/782f9810111c424fececb303d85c8c678d956300))
* **web:** implement Shift+Tab dedent in Markdown textarea ([ab8fbae](https://github.com/danielmontes9/md2jira/commit/ab8fbae48b3d436bcfc22f787ff70b4f88e5efb6))
* **web:** integrate history, settings, i18n, and print into app shell ([f8baaba](https://github.com/danielmontes9/md2jira/commit/f8baabaf327c6ae422c67273e595f05e28d2a4e5))
* **web:** migrate InsertMenu Table/Quote to TipTap commands, remove dead prop, aria-label, E2E tests ([6a584c5](https://github.com/danielmontes9/md2jira/commit/6a584c50c130b14f16a851c27730577be0b8b524))
* **web:** multiple improvements to web app quality and reliability ([5fdb576](https://github.com/danielmontes9/md2jira/commit/5fdb576a9bfedd169225341b6b6c47619871dbf2))
* **web:** redesign WYSIWYG toolbar to be Jira-like ([e87c171](https://github.com/danielmontes9/md2jira/commit/e87c171dd77b4ed602a77cc4388e47490f291097))
* **web:** refactor editor toolbar, add lazy loading, URL deep-linking, and tests ([bc9e31b](https://github.com/danielmontes9/md2jira/commit/bc9e31b1ef2959cc21ee3fe32b50b830325b97ef))
* **web:** replace Turndown HTML→Markdown roundtrip with ProseMirror serializer ([4fa4f16](https://github.com/danielmontes9/md2jira/commit/4fa4f16a9b1bdb73568fbec9059409e07668720e))
* **web:** stable exec refs, span color roundtrip, emoji feedback, remove-color aria ([9eabd0f](https://github.com/danielmontes9/md2jira/commit/9eabd0fd0a0d26ad77a11c65c7de19b28715d80e))
* **web:** table controls, lossy-marks badge, bulk history delete, toolbar scroll ([d8c4d37](https://github.com/danielmontes9/md2jira/commit/d8c4d372685a0cc148fabbc180ada753254202a4))
* **web:** toggleCode/toggleCodeBlock commands, activeFormats expanded, migrate Code buttons to TipTap ([27ac51d](https://github.com/danielmontes9/md2jira/commit/27ac51d9bab1af5711bc415883ff1a870e943eb0))
* **web:** toolbar scroll fix, Select All bulk delete, badge visibility, memoize hasLossyMarks ([5fb6e7b](https://github.com/danielmontes9/md2jira/commit/5fb6e7b63e2299d9da555d78af815090228be3cc))
* **web:** warning triangle icon, VITE_BASE_URL docs, onColorWarning tests, visual baselines ([f8f11a8](https://github.com/danielmontes9/md2jira/commit/f8f11a887d734d6db04f1a96226cedda638fa04a))


### Performance Improvements

* **core:** singleton remark processor; test: E2E file import, README task list docs, core branches threshold ([552e343](https://github.com/danielmontes9/md2jira/commit/552e343748caeb0532ac6a7d68ca72162d744a14))
* **web:** cache encoded markdown to avoid double btoa in useDeepLink ([782488e](https://github.com/danielmontes9/md2jira/commit/782488e5627d240c4d349b72bbcaba8629fa34c5))
* **web:** memo-wrap CopyEditGroup and EditorToolbar, stabilize activeFormats ref ([e171bf5](https://github.com/danielmontes9/md2jira/commit/e171bf5f73036fb19930427f56b612e5b8cf4226))
* **web:** memoize highlightWiki and highlightJson in JiraOutputContent ([0cec410](https://github.com/danielmontes9/md2jira/commit/0cec4108af219d818a08a57dec8b1af362298385))


### BREAKING CHANGES

* WYSIWYG editing now requires TipTap peer dependencies.
The useWysiwygEditor hook is removed; use useTiptapEditor instead.

## [1.4.1](https://github.com/danielmontes9/md2jira/compare/v1.4.0...v1.4.1) (2026-04-11)


### Bug Fixes

* **core:** normalise CRLF line endings and collapse empty lines in tables ([24770d0](https://github.com/danielmontes9/md2jira/commit/24770d0b884b7eab43daa16329936d45d6ca7521))

# [1.4.0](https://github.com/danielmontes9/md2jira/compare/v1.3.0...v1.4.0) (2026-04-07)


### Features

* **cli:** add CLI package with file/stdin input and file/stdout output ([2be333e](https://github.com/danielmontes9/md2jira/commit/2be333e762f90c0b47270ed177f356d951901f7b))

# [1.3.0](https://github.com/danielmontes9/md2jira-previewer/compare/v1.2.2...v1.3.0) (2026-04-05)


### Bug Fixes

* **web:** responsive toolbar via container queries, plain-text copy fix ([bc50ccf](https://github.com/danielmontes9/md2jira-previewer/commit/bc50ccfb8e39d6f5ddf4a585f1e6414519da1c38))


### Features

* **web:** add keyboard shortcuts and editor toolbar improvements ([0b4df53](https://github.com/danielmontes9/md2jira-previewer/commit/0b4df535a0c8e68c570dcea4fa93f7c5bfe1c5a2))
* **web:** add Tab indent and native undo support to markdown editor ([c4c2c96](https://github.com/danielmontes9/md2jira-previewer/commit/c4c2c96724449deb9164a7db2c744f6b9e3bcb3b))
* **web:** add Toast notification component and import file validation ([7569041](https://github.com/danielmontes9/md2jira-previewer/commit/75690412f32bd176ddac7092a281443783bebed6))

## [1.2.2](https://github.com/danielmontes9/md2jira-previewer/compare/v1.2.1...v1.2.2) (2026-04-02)


### Bug Fixes

* **ci:** update pnpm filter from 'core' to 'md2jira-core' after rename ([88b6875](https://github.com/danielmontes9/md2jira-previewer/commit/88b68754c3dad4a1b35dbcdae1fe1780930e46da))
* **core:** add prepublishOnly script and dist verification in release ([1dd2285](https://github.com/danielmontes9/md2jira-previewer/commit/1dd228507e272e146412d2470f3ef68b7e479991))
* **web:** add vite resolve.alias for md2jira-core to bypass dist resolution ([a20ecd7](https://github.com/danielmontes9/md2jira-previewer/commit/a20ecd72357d89bf60ddf81fa836e1837653c6c5))

## [1.2.2](https://github.com/danielmontes9/md2jira-previewer/compare/v1.2.1...v1.2.2) (2026-04-02)


### Bug Fixes

* **ci:** update pnpm filter from 'core' to 'md2jira-core' after rename ([88b6875](https://github.com/danielmontes9/md2jira-previewer/commit/88b68754c3dad4a1b35dbcdae1fe1780930e46da))
* **core:** add prepublishOnly script and dist verification in release ([1dd2285](https://github.com/danielmontes9/md2jira-previewer/commit/1dd228507e272e146412d2470f3ef68b7e479991))
* **web:** add vite resolve.alias for md2jira-core to bypass dist resolution ([a20ecd7](https://github.com/danielmontes9/md2jira-previewer/commit/a20ecd72357d89bf60ddf81fa836e1837653c6c5))

## [1.2.2](https://github.com/danielmontes9/md2jira-previewer/compare/v1.2.1...v1.2.2) (2026-04-01)


### Bug Fixes

* **ci:** update pnpm filter from 'core' to 'md2jira-core' after rename ([88b6875](https://github.com/danielmontes9/md2jira-previewer/commit/88b68754c3dad4a1b35dbcdae1fe1780930e46da))
* **core:** add prepublishOnly script and dist verification in release ([1dd2285](https://github.com/danielmontes9/md2jira-previewer/commit/1dd228507e272e146412d2470f3ef68b7e479991))
* **web:** add vite resolve.alias for md2jira-core to bypass dist resolution ([a20ecd7](https://github.com/danielmontes9/md2jira-previewer/commit/a20ecd72357d89bf60ddf81fa836e1837653c6c5))

## [1.2.2](https://github.com/danielmontes9/md2jira-previewer/compare/v1.2.1...v1.2.2) (2026-04-01)


### Bug Fixes

* **ci:** update pnpm filter from 'core' to 'md2jira-core' after rename ([88b6875](https://github.com/danielmontes9/md2jira-previewer/commit/88b68754c3dad4a1b35dbcdae1fe1780930e46da))
* **core:** add prepublishOnly script and dist verification in release ([1dd2285](https://github.com/danielmontes9/md2jira-previewer/commit/1dd228507e272e146412d2470f3ef68b7e479991))
* **web:** add vite resolve.alias for md2jira-core to bypass dist resolution ([a20ecd7](https://github.com/danielmontes9/md2jira-previewer/commit/a20ecd72357d89bf60ddf81fa836e1837653c6c5))

## [1.2.1](https://github.com/danielmontes9/md2jira-previewer/compare/v1.2.0...v1.2.1) (2026-04-01)


### Bug Fixes

* **ci:** upgrade deploy.yml pnpm to v10, expand tsconfig paths for web ([75d3dd5](https://github.com/danielmontes9/md2jira-previewer/commit/75d3dd596a229ee73e9a07e818af5c33b4a8aae9))
* **ci:** upgrade pnpm to v10 in workflows and fix repository.url format ([dbace0c](https://github.com/danielmontes9/md2jira-previewer/commit/dbace0c1de9eb043f481f0a6efdbb68d18527e42))
* **web:** add tsconfig paths alias for md2jira-core workspace package ([5e74490](https://github.com/danielmontes9/md2jira-previewer/commit/5e744900365a0627e41ad108a23f3435534b11d2))

# [1.2.0](https://github.com/danielmontes9/md2jira-previewer/compare/v1.1.0...v1.2.0) (2026-04-01)


### Features

* **web:** add GitHub link button and responsive 3-row mobile header ([a8cc8ac](https://github.com/danielmontes9/md2jira-previewer/commit/a8cc8ac0b89cddd3541063691f03efbf71ab5499))

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
