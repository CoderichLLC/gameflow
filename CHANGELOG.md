## 1.7.0
- actor.push and actor.unshift; actor.stream deprecated

## 1.6.0
- No longer setting promise.$follow instead context.followPromise is set

## 1.5.2
- Fixed bug with stream.abort() incorrectly keeping track of actions in progress

## 1.5.0
- EventEmitter.offFunction now accepts array/n args and returns the EventEmitter instance for chaining

## 1.4.0
- Stream supports chained boolean

## 1.3.1
- Added Force class
- Stream supports batch
- abortListeners now an array like the other listeners
- startListeners called AFTER first step is called

## 1.2.0
- Bug fix action.pause()
- Node22
