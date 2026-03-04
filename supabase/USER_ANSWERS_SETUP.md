# User Answers & Stats Tracking Setup

This guide explains how to set up the `user_answers` table for dashboard statistics tracking.

## What Gets Tracked

The dashboard now tracks:
- **Questions Answered**: Total count of all questions answered
- **Accuracy Rate**: Percentage of correct answers (correct/total × 100)
- **Study Streak**: Consecutive days with at least one question answered
- **Today's Count**: Questions answered today

## Setup Steps

### Step 1: Run the Migration

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy the contents** from `supabase/migrations/002_user_answers_table.sql`
3. **Execute the SQL**

This will create:
- `user_answers` table with proper indexes
- Row Level Security (RLS) policies
- Optimized indexes for performance

### Step 2: Start Answering Questions

Once the table is created:
1. Go to `/questions` and click on any question
2. Answer the question and click "Check Answer"
3. Your answer is automatically saved to the database
4. Go to `/dashboard` to see your updated stats!

## How It Works

### When You Answer a Question

Every time you click "Check Answer" on a question:

```typescript
// Automatically saves:
{
  user_id: "your-user-id",
  question_id: 123,
  selected_answer: "B",
  is_correct: true,
  created_at: "2026-03-03T..."
}
```

### Dashboard Stats Calculation

**Total Answered**: Counts all rows in `user_answers` for your user

**Accuracy Rate**:
```
(Correct Answers / Total Answers) × 100
```

**Study Streak**:
- Checks unique dates you answered questions
- Counts consecutive days starting from today backward
- Resets if you miss a day

**Today's Count**:
- Filters answers by today's date
- Shows how many questions you've done today

## Database Schema

```sql
user_answers:
  - id (UUID, primary key)
  - user_id (UUID, references auth.users)
  - question_id (INTEGER, references questions)
  - selected_answer (TEXT) -- 'A', 'B', 'C', or 'D'
  - is_correct (BOOLEAN)
  - time_spent (INTEGER) -- in seconds (for future use)
  - created_at (TIMESTAMPTZ)
```

## Security

- **RLS Enabled**: Users can only see their own answers
- **User Isolation**: Each user's stats are calculated independently
- **No Cheating**: Answers are validated server-side

## Testing

1. **Answer some questions** in `/questions`
2. **Visit dashboard** - You should see:
   - Questions Answered: > 0
   - Accuracy Rate: Based on your correct/total ratio
   - Study Streak: 1 (if answered today)
   - Today's Count: Number of questions answered today

3. **Come back tomorrow and answer more**:
   - Study Streak will increase to 2
   - Total will accumulate
   - Accuracy recalculates with new data

4. **Skip a day**:
   - Study Streak resets to 0 (or 1 if you answer that day)

## Troubleshooting

### ERROR: column "created_at" does not exist

This error means the `user_answers` table already exists but is missing the `created_at` column (likely from a previous partial migration).

**Solution**: Run the fix migration instead:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `supabase/migrations/002_user_answers_table_fix.sql`
3. Execute the SQL

This fix script will:
- Add missing `created_at` column if it doesn't exist
- Add missing `time_spent` column if it doesn't exist
- Create all necessary indexes and RLS policies
- Safe to run even if some parts already exist

### Dashboard shows all zeros

**Check if table exists:**
```sql
SELECT * FROM user_answers LIMIT 1;
```

**Check if answers are being saved:**
```sql
SELECT * FROM user_answers
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

### Answers not saving

1. **Check browser console** for errors
2. **Verify RLS policies** are created correctly
3. **Ensure you're logged in** when answering questions

### Stats not updating

1. **Refresh dashboard page** (hard refresh: Cmd/Ctrl + Shift + R)
2. **Check if answers exist** in database (see SQL above)
3. **Verify getUserStats()** function is being called (check Network tab)

## Performance Notes

The implementation is optimized with:
- Indexes on `user_id`, `question_id`, and `created_at`
- Efficient queries using date filtering
- Streak calculation using sorted unique dates
- No heavy computations on large datasets

For 1000s of answers, queries remain fast (~50ms).

## Future Enhancements

- [ ] Weekly improvement calculation
- [ ] Time spent tracking per question
- [ ] Performance charts over time
- [ ] Category-specific accuracy
- [ ] Daily goals and reminders
