package preconfigs

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
)

func MakeTLSServer(certFile, keyFile string) (*tls.Config, error) {
	if certFile == "" || keyFile == "" {
		return nil, fmt.Errorf("both TLS certificate and key files are required")
	}

	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return nil, fmt.Errorf("load TLS certificate pair: %w", err)
	}

	return &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}, nil
}

func MiaokoRootCAPrepare() *x509.CertPool {
	rootCAs := x509.NewCertPool()
	rootCAs.AppendCertsFromPEM(MIAOKO_ROOT_CA)
	return rootCAs
}
