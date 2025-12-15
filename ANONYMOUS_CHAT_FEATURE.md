# Anonymous Chat Feature Documentation

## Overview
Added anonymous messaging feature specifically for student-to-teacher communication only. Students can choose to send messages anonymously to Teachers, HODs, and PMs.

## Restrictions
- ✅ **Allowed**: Students → Teachers/HODs/PMs (anonymous)
- ❌ **Not Allowed**: 
  - Student → Student (anonymous)
  - Teacher → Anyone (anonymous)
  - Admin → Anyone (anonymous)

## Implementation Details

### Frontend Changes

#### 1. MessageLayout Component (`frontend/src/components/MessageLayout.jsx`)
- Added `faUserSecret` icon import
- Added `userRole` prop to check if current user is a student
- Added `isAnonymous` state to track anonymous mode toggle
- Added `canSendAnonymously` check: only true when student is messaging teacher/HOD/PM
- Updated message bubble rendering:
  - Shows "Anonymous Student" icon and name for anonymous messages received
  - Shows anonymous indicator icon for anonymous messages sent by current user
  - Adds `.anonymous-message` class for visual distinction
- Added anonymous toggle UI:
  - Button to enable/disable anonymous mode
  - Shows confirmation text when anonymous mode is active
  - Toggle automatically resets after sending message

#### 2. Student Dashboard (`frontend/src/pages/StudentDashboard.jsx`)
- Updated `handleSendDirectMessage` to accept `isAnonymous` parameter
- Passes `isAnonymous` to `sendDirectMessage` function
- Added `userRole` prop to MessageLayout component

#### 3. Teacher & Admin Dashboards
- Added `userRole` prop to MessageLayout component (required for component to work)
- Teachers/Admins won't see the anonymous toggle (only students messaging teachers see it)

#### 4. Socket Hook (`frontend/src/hooks/useSocket.js`)
- Updated `sendDirectMessage` to include `isAnonymous` parameter
- Passes anonymous flag to socket service

#### 5. Styles (`frontend/src/styles/global.css`)
- `.anonymous-toggle-container`: Container for toggle button and note
- `.anonymous-toggle-btn`: Blue outlined button, turns solid blue when active
- `.anonymous-toggle-btn.active`: Active state styling
- `.anonymous-note`: Italic gray text explaining anonymous mode
- `.chat-message-bubble.anonymous-message`: Gray left border for anonymous messages
- `.anonymous-indicator`: Small icon indicator for sent anonymous messages

### Backend Changes

#### 1. Socket Handler (`backend/server.js`)
- Updated `send-direct-message` event handler:
  - Extracts `isAnonymous` flag from data
  - Validates anonymous messages:
    - Checks sender role is 'Student'
    - Checks receiver role is 'Teacher', 'HOD', or 'PM'
    - Emits error if validation fails
  - Includes `is_anonymous` field in database INSERT
  - Returns `is_anonymous` field in query results
  - Hides sender name for receiver when `isAnonymous` is true
  - Always shows real name to sender

#### 2. Direct Messages Routes (`backend/routes/directMessages.js`)
- **Conversations Endpoint** (`/conversations/:userId`):
  - Removed `is_anonymous = false` filter to include anonymous conversations
  - Changed `is_anonymous` from hardcoded `false` to `m.is_anonymous`
  - Removed anonymous filter from unread count query
  
- **Messages Endpoint** (`/messages/:userId/:otherUserId`):
  - Added CASE statement to show "Anonymous Student" instead of real name when:
    - Message is anonymous (`m.is_anonymous = true`)
    - Current user is the receiver (`m.receiver_id = $1`)
  - Sender always sees their real name

### Database Schema
No changes needed - the `messages` table already has the `is_anonymous` BOOLEAN field:
```sql
is_anonymous BOOLEAN DEFAULT FALSE
```

## User Experience

### For Students:
1. Open direct messages and select a teacher/HOD/PM
2. See "Send Anonymously" button above message input
3. Click to enable anonymous mode (button turns blue, shows "Anonymous Mode ON")
4. Type and send message
5. Anonymous mode automatically turns off after sending
6. Sent anonymous messages show a small lock icon indicator
7. Can see their own name in sent messages (not hidden from themselves)

### For Teachers/HODs/PMs:
1. Receive anonymous messages from students
2. See "👤 Anonymous Student" instead of student name
3. Messages have a gray left border indicating anonymity
4. Cannot reply anonymously (no anonymous toggle shows)
5. Can reply normally, and student will see teacher's real name

### For Other Users:
- Admin, PM, HOD cannot send anonymous messages
- Students cannot send anonymous messages to other students
- Backend validation prevents unauthorized anonymous messaging

## Security
- Server-side validation ensures only students can send anonymous to teachers
- Role checking prevents misuse of anonymous feature
- Anonymous flag stored in database for audit trail
- Student identity protected from teacher view
- Student can always see their own messages (accountability)

## Testing Checklist
- [ ] Student can toggle anonymous mode when messaging teacher
- [ ] Student sees "Anonymous Student" for received anonymous messages
- [ ] Teacher sees "Anonymous Student" for anonymous messages from students
- [ ] Student cannot send anonymous to another student
- [ ] Teacher cannot send anonymous messages
- [ ] Admin cannot send anonymous messages
- [ ] Anonymous messages appear in conversations list
- [ ] Unread count includes anonymous messages
- [ ] Anonymous mode resets after sending
- [ ] Real-time updates work with anonymous messages
