# File Writer

Works in **Deno** and **NodeJS**.

This module exports two functions: `appendText` and `writeText`.

The purpose of this functions is to work asynchronously without the need of
waiting for the result.

If multiple write requests appear without the previous write job has been
finished, the functions cache the data and reschedule the operation.

## Usage

### Append text asynchronously

```ts
import { appendText } from "@popov/file_writer";

appendText("log.txt", "foo\n");
appendText("log.txt", "bar\n");

// `log.txt` contains:
// foo
// bar
```

### Write text asynchronously

```ts
import { writeText } from "@popov/file_writer";

writeText("log.txt", "foo\n");
writeText("log.txt", "bar\n");

// `log.txt` contains:
// bar
```

Copyright 2024 Forex Software Ltd.

All rights reserved. MIT license.
