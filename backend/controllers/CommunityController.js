const Community = require('../models/Community');
const Course = require('../models/Course');
const User = require('../models/User');
const pool = require('../config/database');

class CommunityController {

    // Helper to generic join code (duplicated from CourseController for now, could be in utils)
    static generateJoinCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    static async getAllCommunities(req, res, next) {
        try {
            const { page = 1, limit = 50, status } = req.query;
            const offset = (page - 1) * limit;

            const communities = await Community.findAll({ status }, { limit, offset });
            const totalCommunities = await Community.count({ status });

            res.json({
                communities,
                totalCommunities,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCommunities / limit)
            });
        } catch (err) {
            next(err);
        }
    }

    static async getStudentCommunities(req, res, next) {
        try {
            const { studentId } = req.params;
            const communities = await Community.findByStudentId(studentId);
            res.json(communities);
        } catch (err) {
            next(err);
        }
    }

    static async getTeacherCommunities(req, res, next) {
        try {
            const { teacherId } = req.params;
            const communities = await Community.findByTeacherId(teacherId);
            res.json(communities);
        } catch (err) {
            next(err);
        }
    }

    static async getHODCommunities(req, res, next) {
        try {
            const { hodId } = req.params;
            const user = await User.findById(hodId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const communities = await Community.findByDepartment(user.department, hodId);
            res.json(communities);
        } catch (err) {
            next(err);
        }
    }

    static async getCommunityById(req, res, next) {
        try {
            const { id } = req.params;
            const community = await Community.findById(id);

            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }

            res.json(community);
        } catch (err) {
            next(err);
        }
    }

    static async createCommunity(req, res, next) {
        try {
            const { id, name, status = 'active' } = req.body;
            // Note: Standalone communities not linked to course? 
            // The route logic suggested id can be passed, but usually course_id is needed if relational.
            // The original route had INSERT logic without course_id check. Assuming standard communities.

            const joinCode = CommunityController.generateJoinCode();
            console.log(`[COMMUNITY_CREATE] Generated join code for ${name}: ${joinCode}`);

            const newCommunity = await Community.create({ id, name, join_code: joinCode, status });
            res.status(201).json(newCommunity);
        } catch (err) {
            next(err);
        }
    }

    static async updateCommunity(req, res, next) {
        try {
            const { id } = req.params;
            const { name, status } = req.body;

            const updatedCommunity = await Community.update(id, { name, status });

            if (!updatedCommunity) {
                return res.status(404).json({ message: 'Community not found' });
            }

            res.json(updatedCommunity);
        } catch (err) {
            next(err);
        }
    }

    static async deleteCommunity(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Community.delete(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Community not found' });
            }
            res.json({ message: 'Community deleted successfully' });
        } catch (err) {
            next(err);
        }
    }

    static async getMembers(req, res, next) {
        try {
            const { id } = req.params;
            const members = await Community.getMembers(id);
            res.json({
                members,
                totalMembers: members.length
            });
        } catch (err) {
            next(err);
        }
    }

    static async getMessages(req, res, next) {
        try {
            const { id } = req.params;
            const { limit = 50, userId } = req.query;

            const messages = await Community.getMessages(id, limit);

            if (userId) {
                await Community.updateMessagesRead(id, userId);
            }

            res.json(messages);
        } catch (err) {
            next(err);
        }
    }

    static async joinCommunity(req, res, next) {
        try {
            const { joinCode, studentId } = req.body;

            if (!joinCode || !studentId) {
                return res.status(400).json({ message: 'Join code and student ID are required' });
            }

            const community = await Community.findByJoinCode(joinCode.toUpperCase());

            if (!community || community.status !== 'active') {
                return res.status(404).json({ message: 'Invalid join code or community not found' });
            }

            const isEnrolled = (await Course.getEnrolledStudents(community.course_id)).find(s => s.id === parseInt(studentId));
            if (isEnrolled) {
                return res.status(400).json({ message: 'You are already a member of this community' });
            }

            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            if (student.department !== community.department) {
                return res.status(403).json({
                    message: `This community is for ${community.department} department students only`
                });
            }

            await Course.assignStudents(community.course_id, [studentId]);

            res.json({
                message: 'Successfully joined community!',
                community: {
                    id: community.id,
                    name: community.name,
                    course_name: community.course_name,
                    course_code: community.course_code
                }
            });

        } catch (err) {
            next(err);
        }
    }

    static async leaveCommunity(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = req.user.userId;
            const userRole = req.user.role;

            if (userRole !== 'Student') {
                return res.status(403).json({ message: 'Only students can leave a community. Teachers must disband it.' });
            }

            const community = await Community.findById(id);
            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }

            const removedCount = await Course.removeStudents(community.course_id, [studentId]);

            if (removedCount === 0) {
                return res.status(400).json({ message: 'You are not a member of this community' });
            }

            res.json({ message: 'Successfully left the community' });

        } catch (err) {
            next(err);
        }
    }

    static async deleteMessage(req, res, next) {
        try {
            const { communityId, messageId } = req.params;
            const userId = req.user.userId;

            const message = await Community.findMessageById(messageId);

            if (!message || parseInt(message.community_id) !== parseInt(communityId)) {
                return res.status(404).json({ message: 'Message not found' });
            }

            if (message.sender_id !== userId) {
                return res.status(403).json({ message: 'You can only delete your own messages' });
            }

            await Community.deleteMessage(messageId);
            res.json({ message: 'Message deleted successfully', deletedMessageId: parseInt(messageId) });

        } catch (err) {
            next(err);
        }
    }

    static async deleteMultipleMessages(req, res, next) {
        try {
            const { communityId } = req.params;
            const { messageIds } = req.body;
            const userId = req.user.userId;

            const result = await Community.deleteMultipleMessages(messageIds, userId, communityId);

            res.json({
                message: 'Messages deleted successfully',
                deletedCount: result.rowCount,
                deletedIds: result.rows.map(r => r.id)
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = CommunityController;
