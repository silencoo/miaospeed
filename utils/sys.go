package utils

import (
	"os"
	"os/signal"
	"syscall"
)

func MakeSysChan() chan os.Signal {
	sigCh := make(chan os.Signal, 1)
	// Windows 对 syscall.SIGINT 支持不稳定，显式监听 os.Interrupt
	signal.Notify(sigCh, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	return sigCh
}
