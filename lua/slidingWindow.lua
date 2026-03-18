-- Sliding Window Algorithm Lua Script

-- KEYS[1]: window_key
-- ARGV[1]: window_size (seconds)
-- ARGV[2]: max_requests

local window_key = KEYS[1]
local window_size = tonumber(ARGV[1])
local max_requests = tonumber(ARGV[2])

-- Get current timestamp in seconds
local current_time = redis.call("TIME")[1]

-- Remove expired timestamps from the sorted set
redis.call("ZREMRANGEBYSCORE", window_key, 0, current_time - window_size)

-- Add the current timestamp to the sorted set
redis.call("ZADD", window_key, current_time, current_time)

-- Get the number of requests in the current window
local request_count = redis.call("ZCARD", window_key)

-- Check if the request can be granted
if request_count < max_requests then
    return 1
else
    return 0
end
