package preconfigs

import (
	_ "embed"
)

//go:embed embeded/ca-certificates.crt
var MIAOKO_ROOT_CA []byte
