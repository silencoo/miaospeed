package utils

import (
	"crypto/subtle"

	"github.com/miaokobot/miaospeed/interfaces"
	"github.com/miaokobot/miaospeed/utils/structs"
)

type GlobalConfig struct {
	Token            string
	Binder           string
	WhiteList        []string
	SpeedLimit       uint64
	PauseSecond      uint
	ConnTaskTreading uint
	MiaoKoSignedTLS  bool
	TLSCertFile      string
	TLSKeyFile       string
	NoSpeedFlag      bool
	MaxmindDB        string
}

func (gc *GlobalConfig) InWhiteList(invoker string) bool {
	if len(gc.WhiteList) == 0 {
		return true
	}

	return structs.Contains(gc.WhiteList, invoker)
}

func (gc *GlobalConfig) VerifyRequest(req *interfaces.SlaveRequest) bool {
	expectedChallenge := gc.SignRequest(req)
	return subtle.ConstantTimeCompare([]byte(req.Challenge), []byte(expectedChallenge)) == 1
}

func (gc *GlobalConfig) SignRequest(req *interfaces.SlaveRequest) string {
	return SignRequest(gc.Token, req)
}

var GCFG GlobalConfig
