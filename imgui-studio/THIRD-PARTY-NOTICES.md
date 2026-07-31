# Third-Party Notices

ImGuiStudio ships compiled copies of software written by other people. Their
licenses require the notices below to travel with any copy of the app, including
the static bundle served at https://aethyr.gg/imgui-studio/, so this file is
part of the distribution rather than a courtesy.

All three are MIT. That means their authors grant you the right to use, copy,
modify, and redistribute those components directly, and nothing in ImGuiStudio's
own [LICENSE](LICENSE) restricts what you may do with them. If you want Dear
ImGui, JSON for Modern C++, or the Emscripten runtime, take them from upstream
rather than from `app/engine.js`, where they are compiled together with code
that is not MIT.

## Where Each One Ends Up

`app/engine.js` is a single-file emscripten build with the wasm binary embedded
in it, so all three components below are inside that one file.

Dear ImGui - vendored as a git submodule at `engine/imgui`, pinned to v1.92.1,
unpatched. Compiled into `app/engine.js`. `app/imguidocs.js` is generated from
the vendored `imgui.h` and carries function declarations and doc comments from
it, so it is a derivative of Dear ImGui too.

JSON for Modern C++ - vendored as a single header at `engine/json.hpp`, version
3.11.3. Compiled into `app/engine.js`.

Emscripten - not vendored. `emcc` emits its JavaScript runtime support code
directly into `app/engine.js` at build time.

Note: `playwright-core` is a development dependency used by the test suite. It
is not part of the app and is not redistributed, so it is not listed here.

## Dear ImGui

https://github.com/ocornut/imgui

```
The MIT License (MIT)

Copyright (c) 2014-2025 Omar Cornut

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## JSON for Modern C++

https://github.com/nlohmann/json

```
MIT License

Copyright (c) 2013-2025 Niels Lohmann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Emscripten

https://github.com/emscripten-core/emscripten

Emscripten is dual-licensed under the MIT License and the University of Illinois
/ NCSA Open Source License. The MIT text is reproduced here.

```
Copyright (c) 2010-2014 Emscripten authors, see AUTHORS file.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
