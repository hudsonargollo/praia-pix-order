-- Test creating a waiter directly via SQL
-- Run this in Supabase SQL Editor to test

SELECT create_waiter_user(
  'hudsonargollo2@gmail.com',
  '123456',
  'HUDSON',
  '5556997145414'
);
