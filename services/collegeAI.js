const axios = require('axios');
const collegeConfig = require('../config/college');

class CollegeAI {
    constructor() {
        this.config = collegeConfig;
        this.conversationContext = new Map();
    }

    // Main method to process user queries
    async processQuery(userInput, sessionId, conversationHistory = []) {
        try {
            // Analyze the user's intent
            const intent = this.analyzeIntent(userInput);
            
            // Get appropriate response based on intent
            let response = await this.generateResponse(intent, userInput, sessionId, conversationHistory);
            
                // Check if we need to forward to staff
    if (intent.requiresStaff) {
        try {
            await this.forwardToStaff(userInput, sessionId);
            response += "\n\nI've forwarded your query to our staff team. They'll contact you shortly with detailed information.";
        } catch (error) {
            console.log('Staff forwarding failed, but continuing with response:', error.message);
            // Don't add the forwarding message if it fails
        }
    }
            
            return response;
            
        } catch (error) {
            console.error('Error processing college query:', error);
            return "I apologize, but I'm experiencing some technical difficulties. Please try again or contact our admissions office directly.";
        }
    }

    // Analyze user intent from input
    analyzeIntent(userInput) {
        const input = userInput.toLowerCase();
        
        // Admission related queries
        if (input.includes('admission') || input.includes('apply') || input.includes('enroll') || input.includes('join')) {
            return {
                type: 'admission',
                requiresStaff: false,
                priority: 'high'
            };
        }
        
        // Fee related queries
        if (input.includes('fee') || input.includes('cost') || input.includes('price') || input.includes('tuition') || input.includes('₹')) {
            return {
                type: 'fees',
                requiresStaff: false,
                priority: 'medium'
            };
        }
        
        // Department related queries
        if (input.includes('department') || input.includes('course') || input.includes('branch') || input.includes('cse') || input.includes('mechanical') || input.includes('civil') || input.includes('ece') || input.includes('ise')) {
            return {
                type: 'departments',
                requiresStaff: false,
                priority: 'medium'
            };
        }
        
        // Faculty related queries
        if (input.includes('faculty') || input.includes('teacher') || input.includes('professor') || input.includes('staff')) {
            return {
                type: 'faculty',
                requiresStaff: true,
                priority: 'medium'
            };
        }
        
        // Placement related queries
        if (input.includes('placement') || input.includes('job') || input.includes('career') || input.includes('salary') || input.includes('company')) {
            return {
                type: 'placement',
                requiresStaff: true,
                priority: 'high'
            };
        }
        
        // Events related queries
        if (input.includes('event') || input.includes('fest') || input.includes('seminar') || input.includes('workshop') || input.includes('activity')) {
            return {
                type: 'events',
                requiresStaff: false,
                priority: 'low'
            };
        }
        
        // Contact related queries
        if (input.includes('contact') || input.includes('phone') || input.includes('email') || input.includes('address') || input.includes('location')) {
            return {
                type: 'contact',
                requiresStaff: false,
                priority: 'low'
            };
        }
        
        // General queries
        return {
            type: 'general',
            requiresStaff: false,
            priority: 'low'
        };
    }

    // Generate response based on intent
    async generateResponse(intent, userInput, sessionId, conversationHistory) {
        switch (intent.type) {
            case 'admission':
                return this.getAdmissionResponse(userInput);
            
            case 'fees':
                return this.getFeesResponse(userInput);
            
            case 'departments':
                return this.getDepartmentsResponse(userInput);
            
            case 'faculty':
                return await this.getFacultyResponse(userInput);
            
            case 'placement':
                return await this.getPlacementResponse(userInput);
            
            case 'events':
                return await this.getEventsResponse(userInput);
            
            case 'contact':
                return this.getContactResponse(userInput);
            
            default:
                return this.getGeneralResponse(userInput);
        }
    }

    // Admission response
    getAdmissionResponse(userInput) {
        const input = userInput.toLowerCase();
        
        if (input.includes('eligibility') || input.includes('requirement')) {
            return `**Admission Eligibility:**\n${this.config.admission.eligibility}\n\n**Entrance Exams Accepted:**\n${this.config.admission.entrance.join(', ')}\n\n**Required Documents:**\n${this.config.admission.documents.join('\n')}`;
        }
        
        if (input.includes('process') || input.includes('step') || input.includes('how')) {
            return `**Admission Process:**\n${this.config.admission.process.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n**Next Steps:**\n1. Fill out our online application form\n2. Submit required documents\n3. Attend counseling session\n4. Complete fee payment\n\nWould you like me to guide you through any specific step?`;
        }
        
        if (input.includes('form') || input.includes('application')) {
            return `**Application Process:**\n\n1. **Online Application:** Visit ${this.config.college.website}/admissions\n2. **Document Upload:** Upload scanned copies of required documents\n3. **Application Fee:** Pay ₹${this.config.fees.other.admission} application fee\n4. **Verification:** Our team will verify your documents\n5. **Interview:** Attend counseling/interview session\n\n**Application Fee:** ₹${this.config.fees.other.admission}\n**Documents Required:**\n${this.config.admission.documents.join('\n')}`;
        }
        
        return `**Welcome to ${this.config.college.name}!** 🎓\n\nI'd be happy to guide you through our admission process. We offer **7 engineering departments** with excellent placement records.\n\n**What would you like to know about?**\n• Admission eligibility & requirements\n• Application process & forms\n• Fee structure & payment\n• Department details\n• Document requirements\n\nJust let me know what information you need!`;
    }

    // Fees response
    getFeesResponse(userInput) {
        const input = userInput.toLowerCase();
        
        if (input.includes('hostel') || input.includes('accommodation')) {
            return `**Hostel & Accommodation Fees:**\n\n🏠 **Hostel Fee:** ₹${this.config.fees.hostel.amount.toLocaleString('en-IN')}/year\n**Includes:** ${this.config.fees.hostel.includes}\n\n🚌 **Transport (Optional):** ₹${this.config.fees.transport.amount.toLocaleString('en-IN')}/year\n**Includes:** ${this.config.fees.transport.includes}\n\n**Additional Charges:**\n• Library Fee: ₹${this.config.fees.other.library.toLocaleString('en-IN')}/year\n• Laboratory Fee: ₹${this.config.fees.other.laboratory.toLocaleString('en-IN')}/year\n\n**Total with Hostel:** ₹${(this.config.fees.tuition.CSE + this.config.fees.hostel.amount).toLocaleString('en-IN')}/year (for CSE branches)`;
        }
        
        if (input.includes('transport') || input.includes('bus')) {
            return `**Transport Services:**\n\n🚌 **Transport Fee:** ₹${this.config.fees.transport.amount.toLocaleString('en-IN')}/year\n**Coverage:** Daily pickup and drop from major areas in Bangalore\n**Routes:** Electronic City, Silk Board, Marathahalli, Whitefield, and surrounding areas\n\n**Note:** Transport is optional and can be availed separately from hostel accommodation.`;
        }
        
        // Department-specific fees
        for (const [dept, info] of Object.entries(this.config.departments)) {
            if (input.includes(dept.toLowerCase()) || input.includes(info.name.toLowerCase())) {
                const totalWithHostel = info.fees + this.config.fees.hostel.amount;
                const totalWithTransport = info.fees + this.config.fees.transport.amount;
                
                return `**${info.name} - Fee Structure:**\n\n💰 **Tuition Fee:** ₹${info.fees.toLocaleString('en-IN')}/year\n🏠 **Hostel (Optional):** ₹${this.config.fees.hostel.amount.toLocaleString('en-IN')}/year\n🚌 **Transport (Optional):** ₹${this.config.fees.transport.amount.toLocaleString('en-IN')}/year\n\n**Total Options:**\n• Tuition Only: ₹${info.fees.toLocaleString('en-IN')}/year\n• Tuition + Hostel: ₹${totalWithHostel.toLocaleString('en-IN')}/year\n• Tuition + Transport: ₹${totalWithTransport.toLocaleString('en-IN')}/year\n• All Inclusive: ₹${(totalWithHostel + this.config.fees.transport.amount).toLocaleString('en-IN')}/year\n\n**Payment Options:**\n• Full payment at admission\n• Semester-wise payment\n• Education loan assistance available`;
            }
        }
        
        return `**Fee Structure at ${this.config.college.name}:**\n\n💰 **Annual Tuition Fees:**\n• **CSE Branches:** ₹${this.config.fees.tuition.CSE.toLocaleString('en-IN')}/year\n  - Computer Science & Engineering\n  - CSE (Data Science)\n  - CSE (AI & ML)\n• **Other Branches:** ₹${this.config.fees.tuition.MECH.toLocaleString('en-IN')}/year\n  - Mechanical Engineering\n  - Civil Engineering\n  - Electronics & Communication\n  - Information Science\n\n🏠 **Hostel:** ₹${this.config.fees.hostel.amount.toLocaleString('en-IN')}/year (including food)\n🚌 **Transport:** ₹${this.config.fees.transport.amount.toLocaleString('en-IN')}/year (optional)\n\n**Additional Fees:**\n• Application: ₹${this.config.fees.other.admission.toLocaleString('en-IN')}\n• Library: ₹${this.config.fees.other.library.toLocaleString('en-IN')}/year\n• Laboratory: ₹${this.config.fees.other.laboratory.toLocaleString('en-IN')}/year\n\nWould you like detailed fees for a specific department?`;
    }

    // Departments response
    getDepartmentsResponse(userInput) {
        const input = userInput.toLowerCase();
        
        // Specific department query
        for (const [dept, info] of Object.entries(this.config.departments)) {
            if (input.includes(dept.toLowerCase()) || input.includes(info.name.toLowerCase())) {
                return `**${info.name}** 🎯\n\n**Duration:** ${info.duration}\n**Available Seats:** ${info.seats}\n**Annual Fee:** ₹${info.fees.toLocaleString('en-IN')}\n\n**Career Prospects:**\n• Software Development\n• Data Analysis\n• AI/ML Engineering\n• Research & Development\n• Higher Studies (M.Tech/PhD)\n\n**Notable Companies:**\n• TCS, Infosys, Wipro\n• Amazon, Google, Microsoft\n• Startups & Product Companies\n\n**Would you like to know about:**\n• Admission process for this department?\n• Fee structure & payment options?\n• Faculty details?\n• Placement statistics?`;
            }
        }
        
        // General departments overview
        return `**Engineering Departments at ${this.config.college.name}:** 🏛️\n\n**Computer Science & Engineering:**\n• **CSE:** ${this.config.departments.CSE.seats} seats, ₹${this.config.departments.CSE.fees.toLocaleString('en-IN')}/year\n• **CSE (Data Science):** ${this.config.departments.CSE_DS.seats} seats, ₹${this.config.departments.CSE_DS.fees.toLocaleString('en-IN')}/year\n• **CSE (AI & ML):** ${this.config.departments.CSE_AI_ML.seats} seats, ₹${this.config.departments.CSE_AI_ML.fees.toLocaleString('en-IN')}/year\n\n**Core Engineering:**\n• **Mechanical:** ${this.config.departments.MECH.seats} seats, ₹${this.config.departments.MECH.fees.toLocaleString('en-IN')}/year\n• **Civil:** ${this.config.departments.CIVIL.seats} seats, ₹${this.config.departments.CIVIL.fees.toLocaleString('en-IN')}/year\n• **ECE:** ${this.config.departments.ECE.seats} seats, ₹${this.config.departments.ECE.fees.toLocaleString('en-IN')}/year\n• **ISE:** ${this.config.departments.ISE.seats} seats, ₹${this.config.departments.ISE.fees.toLocaleString('en-IN')}/year\n\n**All departments are AICTE approved and offer excellent placement opportunities!**\n\nWhich department interests you? I can provide detailed information about any specific branch.`;
    }

    // Faculty response (calls external API)
    async getFacultyResponse(userInput) {
        // Extract department from user input
        let department = 'general';
        for (const [dept, info] of Object.entries(this.config.departments)) {
            if (userInput.toLowerCase().includes(dept.toLowerCase()) || userInput.toLowerCase().includes(info.name.toLowerCase())) {
                department = dept;
                break;
            }
        }
        
        try {
            // Call external API for faculty data
            const response = await axios.get(`${this.config.api.getFaculty}?dept=${department}`, {
                timeout: 5000
            });
            
            if (response.data && response.data.faculty) {
                return `**Faculty Information for ${this.config.departments[department]?.name || 'Engineering'}:**\n\n${response.data.faculty}`;
            } else {
                return `I'm fetching the latest faculty information for ${this.config.departments[department]?.name || 'our engineering departments'}. Our faculty includes experienced professors with industry and research backgrounds. Would you like me to forward your query to our staff for detailed faculty profiles?`;
            }
            
        } catch (error) {
            console.log('Faculty webhook not available, providing default response:', error.message);
            return `Our faculty includes experienced professors with strong academic and industry backgrounds in ${this.config.departments[department]?.name || 'engineering'}. For detailed faculty profiles and availability, please contact our admissions office or let me forward your query to our staff team.`;
        }
    }

    // Placement response (calls external API)
    async getPlacementResponse(userInput) {
        try {
            const response = await axios.get(this.config.api.getPlacements, {
                timeout: 5000
            });
            
            if (response.data && response.data.placements) {
                return `**Placement Statistics:**\n\n${response.data.placements}`;
            } else {
                return `I'm fetching the latest placement statistics. Our college has excellent placement records with top companies visiting campus. Would you like me to forward your query to our placement cell for detailed statistics and company information?`;
            }
            
        } catch (error) {
            console.log('Placement webhook not available, providing default response:', error.message);
            return `Our college has excellent placement records with top companies like TCS, Infosys, Wipro, Amazon, Google, Microsoft, and many startups visiting campus. For detailed placement statistics and company information, please contact our placement cell or let me forward your query to our staff team.`;
        }
    }

    // Events response (calls external API)
    async getEventsResponse(userInput) {
        try {
            const response = await axios.get(this.config.api.getEvents, {
                timeout: 5000
            });
            
            if (response.data && response.data.events) {
                return `**Upcoming Events & Activities:**\n\n${response.data.events}`;
            } else {
                return `I'm fetching the latest event information. Our college hosts various technical fests, cultural events, workshops, and seminars throughout the year. Would you like me to forward your query to our events team for the current calendar?`;
        }
            
        } catch (error) {
            console.log('Events webhook not available, providing default response:', error.message);
            return `Our college hosts various technical fests, cultural events, workshops, and seminars throughout the year. For the current events calendar and upcoming activities, please contact our events team or let me forward your query to our staff team.`;
        }
    }

    // Contact response
    getContactResponse(userInput) {
        return `**Contact Information for ${this.config.college.name}:** 📞\n\n**📱 Phone:** +91-80-1234-5678\n**📧 Email:** admissions@saividya.edu.in\n**🌐 Website:** ${this.config.college.website}\n**📍 Address:** Electronic City, Phase 2, Bangalore - 560100, Karnataka\n\n**Office Hours:**\n• Monday - Friday: 9:00 AM - 5:00 PM\n• Saturday: 9:00 AM - 1:00 PM\n• Sunday: Closed\n\n**Admissions Office:**\n• **Direct Line:** +91-80-1234-5679\n• **WhatsApp:** +91-98765-43210\n• **Emergency:** +91-98765-43211\n\n**How can I help you today?**\n• Schedule a campus visit\n• Request a callback\n• Download prospectus\n• Apply online`;
    }

    // General response
    getGeneralResponse(userInput) {
        return `Thank you for your interest in ${this.config.college.name}! 🎓\n\nI'm here to help you with:\n\n**📚 Academic Information:**\n• Department details & courses\n• Admission process & eligibility\n• Fee structure & payment options\n\n**🏢 College Services:**\n• Faculty information\n• Placement statistics\n• Events & activities\n• Campus facilities\n\n**📞 Contact & Support:**\n• Phone numbers & email\n• Office hours & location\n• Application assistance\n\n**What specific information would you like?**\n\nYou can ask me about:\n• "Tell me about CSE department"\n• "What are the admission requirements?"\n• "How much are the fees?"\n• "Contact information"\n• "Placement details"`;
    }

    // Forward complex queries to staff
    async forwardToStaff(userInput, sessionId) {
        try {
            const staffData = {
                name: this.conversationContext.get(sessionId)?.name || 'Anonymous',
                contact: this.conversationContext.get(sessionId)?.email || 'Not provided',
                query: userInput,
                timestamp: new Date().toISOString(),
                sessionId: sessionId
            };
            
            await axios.post(this.config.api.staffForward, staffData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Query forwarded to staff:', staffData);
            
        } catch (error) {
            console.log('Staff forwarding webhook not available:', error.message);
            // Don't throw error to user, just log it and continue
            throw error; // Re-throw so the calling method can handle it
        }
    }

    // Update conversation context
    updateContext(sessionId, data) {
        this.conversationContext.set(sessionId, {
            ...this.conversationContext.get(sessionId),
            ...data
        });
    }

    // Get conversation context
    getContext(sessionId) {
        return this.conversationContext.get(sessionId) || {};
    }
}

module.exports = CollegeAI;
