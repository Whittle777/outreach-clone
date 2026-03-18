-- Token Bucket Algorithm Lua Script

-- KEYS[1]: bucket_key
-- ARGV[1]: refill_rate (tokens per second)
-- ARGV[2]: bucket_capacity
-- ARGV[3]: request_tokens

local bucket_key = KEYS[1]
local refill_rate = tonumber(ARGV[1])
local bucket_capacity = tonumber(ARGV[2])
local request_tokens = tonumber(ARGV[3])

-- Get current timestamp in seconds
local current_time = redis.call("TIME")[1]

-- Get the last update time and token count from Redis
local last_update, token_count = redis.call("HMGET", bucket_key, "last_update", "token_count")

-- Convert last_update to number, default to current_time if not set
last_update = tonumber(last_update) or current_time

-- Calculate the time elapsed since the last update
local time_elapsed = current_time - last_update

-- Calculate the number of tokens to add based on the time elapsed
local tokens_to_add = math.floor(time_elapsed * refill_rate)

-- Update the token count, ensuring it does not exceed the bucket capacity
token_count = tonumber(token_count) or 0
token_count = math.min(token_count + tokens_to_add, bucket_capacity)

-- Check if the request can be granted
if token_count >= request_tokens then
    -- Deduct the requested tokens
    token_count = token_count - request_tokens
    -- Update the last update time to the current time
    last_update = current_time
    -- Set the updated token count and last update time back to Redis
    redis.call("HMSET", bucket_key, "last_update", last_update, "token_count", token_count)
    return 1
else
    return 0
end
