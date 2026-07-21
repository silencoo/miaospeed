package ping

import (
	"math"
	"sort"
)

func computeAvgOfPing(pings []uint16) uint16 {
	result := uint16(0)
	totalMS := pings[:]
	sort.Slice(totalMS, func(i, j int) bool { return totalMS[i] < totalMS[j] })
	mediumMS := totalMS[len(totalMS)/2]
	threshold := 300
	realCount := uint16(0)
	for _, delay := range totalMS {
		if -threshold < int(delay)-int(mediumMS) && int(delay)-int(mediumMS) < threshold {
			realCount += 1
		}
	}
	for _, delay := range totalMS {
		if -threshold < int(delay)-int(mediumMS) && int(delay)-int(mediumMS) < threshold {
			result += delay / realCount
		}
	}
	return result
}

func computeStdOfPing(pings []uint16, avg uint16) uint16 {
	if len(pings) == 0 {
		return 0
	}
	totalMS := pings[:]
	sort.Slice(totalMS, func(i, j int) bool { return totalMS[i] < totalMS[j] })
	mediumMS := totalMS[len(totalMS)/2]
	threshold := 300
	values := make([]float64, 0, len(totalMS))
	for _, delay := range totalMS {
		if -threshold < int(delay)-int(mediumMS) && int(delay)-int(mediumMS) < threshold {
			values = append(values, float64(delay))
		}
	}
	if len(values) <= 1 {
		return 0
	}
	mean := float64(avg)
	var sum float64
	for _, v := range values {
		diff := v - mean
		sum += diff * diff
	}
	variance := sum / float64(len(values))
	return uint16(math.Round(math.Sqrt(variance)))
}
