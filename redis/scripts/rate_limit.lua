-- rate_limit.lua

-- Read the current count and expiration time
local count = tonumber(redis.call("GET", KEYS[1]))
local expire = tonumber(redis.call("TTL", KEYS[1]))

-- If the key does not exist or has expired, initialize it
if not count or expire < 0 then
    redis.call("SET", KEYS[1], 1)
    redis.call("EXPIRE", KEYS[1], ARGV[1])
    return 1
end

-- Increment the count
count = count + 1

-- If the count exceeds the limit, return 0 (rate limit exceeded)
if count > tonumber(ARGV[2]) then
    return 0
end

-- Update the count and expiration time
redis.call("SET", KEYS[1], count)
redis.call("EXPIRE", KEYS[1], ARGV[1])

return count
