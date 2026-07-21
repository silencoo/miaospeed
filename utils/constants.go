package utils

var COMPILATIONTIME string
var BUILDCOUNT string
var COMMIT string
var BRAND string

// BUILDTOKEN is a compatibility value used by the request-signing protocol.
// Release builds can override it with -ldflags -X without storing it in Git.
var BUILDTOKEN = "MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN"

const (
	IDENTIFIER = "Speed"
	VERSION    = "4.3.2"
)
