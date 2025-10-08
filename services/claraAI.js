const { queryGemini } = require('../geminiApi');
const Staff = require('../models/Staff');
const StaffTimetable = require('../models/StaffTimetable');
const Appointment = require('../models/Appointment');
const staffProfiles = require('../staff-profiles');

class ClaraAI {
  constructor() {
    this.staffCache = new Map();
    this.timetableCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.isDemoMode = false;
    this.currentCallRequest = null;
  }

  /**
   * Main method to process user queries with intelligent staff identification
   */
  async processQuery(message, conversationId, userId = null) {
    try {
      console.log('🤖 Clara AI processing query:', message);

      // Check if we're in demo mode for a video call
      if (this.isDemoMode && this.currentCallRequest) {
        return this.handleDemoModeResponse(message);
      }

      // Analyze the message for staff mentions and intent
      const analysis = await this.analyzeMessage(message);
      
      // Debug logging
      console.log('🔍 Analysis:', {
        staffNames: analysis.staffNames.map(s => s.name),
        intent: analysis.intent,
        isStaffRelated: analysis.isStaffRelated
      });
      
      // Check if this is a video call request - bypass Gemini for calls
      if (this.isVideoCallRequest(message, analysis)) {
        console.log('🎥 Video call request detected, bypassing Gemini AI');
        return this.handleVideoCallRequest(message, analysis);
      }
      
      // Get relevant staff data if staff-related
      const staffData = analysis.isStaffRelated ? await this.getRelevantStaffData(analysis) : {};
      
      // Generate intelligent response using Gemini AI
      const response = await this.generateIntelligentResponse(message, analysis, staffData);
      
      // Check if user wants to schedule a call/appointment
      if (analysis.intent === 'schedule_call' && analysis.identifiedStaff) {
        const callOffer = await this.generateCallOffer(analysis.identifiedStaff, analysis);
        return {
          response: response,
          callOffer: callOffer,
          staffInfo: analysis.identifiedStaff
        };
      }
      
      // If staff name is mentioned but intent wasn't detected as call, still offer call proactively
      if (analysis.staffNames.length > 0 && analysis.intent === 'staff_info_query') {
        const callOffer = await this.generateCallOffer(analysis.staffNames[0], analysis);
        return {
          response: response,
          callOffer: callOffer,
          staffInfo: analysis.staffNames[0]
        };
      }

      return { response: response };
    } catch (error) {
      console.error('❌ Clara AI error:', error);
      return {
        response: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        error: error.message
      };
    }
  }

  /**
   * Check if the message is a video call request
   */
  isVideoCallRequest(message, analysis) {
    const lowerMessage = message.toLowerCase();
    const videoCallKeywords = [
      'video call', 'videocall', 'video chat', 'video meeting', 'video conference',
      'video call with', 'call with', 'video chat with', 'video meeting with',
      'establish video call', 'create video call', 'start video call', 'initiate video call',
      'please video call', 'hey video call', 'can you video call', 'video call anita', 'video call prof',
      'connect via video', 'meet via video', 'talk via video', 'speak via video',
      // Add simple call keywords for direct calling
      'call', 'phone call', 'ring', 'contact'
    ];
    
    // Check for direct staff name patterns in the message
    const staffNamePatterns = [
      'anita', 'anitha', 'prof. anitha', 'professor anitha', 'anita mam', 'anitha mam',
      'lakshmi', 'prof. lakshmi', 'professor lakshmi', 'lakshmi mam',
      'dhivyasri', 'dr. dhivyasri', 'prof. dhivyasri', 'dhivyasri mam',
      'bhavya', 'prof. bhavya', 'professor bhavya', 'bhavya mam'
    ];
    
    const hasStaffName = analysis.staffNames.length > 0;
    const hasCallKeyword = videoCallKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasStaffInMessage = staffNamePatterns.some(pattern => lowerMessage.includes(pattern));
    
    console.log('🔍 Video call detection:', { 
      hasStaffName, 
      hasCallKeyword, 
      hasStaffInMessage,
      message: lowerMessage,
      staffNames: analysis.staffNames.map(s => s.name),
      matchedKeywords: videoCallKeywords.filter(keyword => lowerMessage.includes(keyword))
    });
    
    // Trigger video call mode for:
    // 1. Explicit video call requests with staff names
    // 2. Simple "call [staff]" requests (like "call anita mam")
    const isVideoCallRequest = (hasStaffName && hasCallKeyword) || (hasStaffInMessage && hasCallKeyword);
    
    if (isVideoCallRequest) {
      console.log('🎥 Video call request confirmed - switching to demo mode');
    } else {
      console.log('✅ Not a video call request - continuing with normal processing');
    }
    
    return isVideoCallRequest;
  }

  /**
   * Handle video call request by entering demo mode and creating WebRTC call
   */
  async handleVideoCallRequest(message, analysis) {
    let staffMember = analysis.staffNames[0];
    
    console.log('🎥 Video call request - analysis.staffNames:', analysis.staffNames);
    console.log('🎥 Video call request - message:', message);
    
    // If staff name extraction failed but we detected staff in message, try to find them
    if (!staffMember) {
      const lowerMessage = message.toLowerCase();
      console.log('🎥 No staff member from analysis, checking message patterns...');
      if (lowerMessage.includes('anita') || lowerMessage.includes('anitha')) {
        staffMember = staffProfiles.find(s => s.name === 'Prof. Anitha C S');
        console.log('🎥 Found Anita from message pattern:', staffMember);
      } else if (lowerMessage.includes('lakshmi')) {
        staffMember = staffProfiles.find(s => s.name === 'Prof. Lakshmi Durga N');
        console.log('🎥 Found Lakshmi from message pattern:', staffMember);
      } else if (lowerMessage.includes('dhivyasri')) {
        staffMember = staffProfiles.find(s => s.name === 'Dr. G Dhivyasri');
        console.log('🎥 Found Dhivyasri from message pattern:', staffMember);
      } else if (lowerMessage.includes('bhavya')) {
        staffMember = staffProfiles.find(s => s.name === 'Prof. Bhavya T N');
        console.log('🎥 Found Bhavya from message pattern:', staffMember);
      }
    }
    
    console.log('🎥 Final staff member selected:', staffMember);
    
    if (!staffMember) {
      return {
        response: "I'd be happy to help you make a call, but I need to know which staff member you'd like to contact. Could you please specify the name?",
        error: 'No staff member identified'
      };
    }
    
    // Switch to demo mode
    this.isDemoMode = true;
    this.currentCallRequest = {
      staffName: staffMember.name,
      staffEmail: staffMember.email,
      staffDepartment: staffMember.department,
      requestTime: new Date(),
      conversationId: null
    };

    const response = `🎥 **Video Call Request for ${staffMember.name}**\n\n` +
                    `I understand you'd like to have a video call with ${staffMember.name} from the ${staffMember.department} department.\n\n` +
                    `I'll request a video call connection for you. Please choose an option:\n\n` +
                    `✅ **Accept** - I'll connect you to ${staffMember.name} via video call\n` +
                    `❌ **Reject** - Cancel this request and return to normal chat\n\n` +
                    `Please type "accept" or "reject" to proceed.`;

    return {
      response: response,
      isVideoCallRequest: true,
      staffInfo: staffMember,
      requiresUserDecision: true,
      isDemoMode: true
    };
  }

  /**
   * Handle user response in demo mode
   */
  handleDemoModeResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('accept') || lowerMessage.includes('yes') || lowerMessage.includes('ok')) {
      // User accepted the video call
      const currentReq = this.currentCallRequest;
      const staffMember = currentReq?.staffName;
      
      // Resolve additional staff info for downstream routing
      const profile = (staffMember && Array.isArray(require('../staff-profiles')))
        ? require('../staff-profiles').find(s => s.name === staffMember)
        : null;
      const resolvedEmail = currentReq?.staffEmail || profile?.email || '';
      const resolvedDept = currentReq?.staffDepartment || profile?.department || '';
      
      // Exit demo mode
      this.isDemoMode = false;
      this.currentCallRequest = null;
      
      return {
        response: `🎉 **Video Call Accepted!**\n\n` +
                  `Perfect! I've sent a video call request to ${staffMember}. ` +
                  `You'll be connected as soon as they're available.\n\n` +
                  `Please wait while I establish the connection...`,
        isVideoCallAccepted: true,
        staffInfo: { name: staffMember, email: resolvedEmail, department: resolvedDept },
        exitDemoMode: true
      };
    } else if (lowerMessage.includes('reject') || lowerMessage.includes('no') || lowerMessage.includes('cancel')) {
      // User rejected the video call
      const staffMember = this.currentCallRequest.staffName;
      
      // Exit demo mode
      this.isDemoMode = false;
      this.currentCallRequest = null;
      
      return {
        response: `❌ **Video Call Cancelled**\n\n` +
                  `I've cancelled the video call request for ${staffMember}. ` +
                  `You can continue chatting with me normally, or let me know if there's anything else I can help you with!`,
        isVideoCallRejected: true,
        exitDemoMode: true
      };
    } else {
      // User didn't provide a clear response, remind them
      return {
        response: `🤔 I need a clear response to proceed with your video call request.\n\n` +
                  `Please type:\n` +
                  `• **"accept"** to connect with ${this.currentCallRequest.staffName}\n` +
                  `• **"reject"** to cancel the request\n\n` +
                  `What would you like to do?`,
        requiresUserDecision: true
      };
    }
  }

  /**
   * Reset demo mode (called after video call ends)
   */
  resetDemoMode() {
    this.isDemoMode = false;
    this.currentCallRequest = null;
  }

  /**
   * Analyze user message for staff mentions and intent
   */
  async analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Extract staff names from the message
    const staffNames = await this.extractStaffNames(lowerMessage);
    
    // Determine if this is a staff-related query
    const isStaffRelated = staffNames.length > 0 || 
                          lowerMessage.includes('staff') || 
                          lowerMessage.includes('teacher') || 
                          lowerMessage.includes('professor') || 
                          lowerMessage.includes('faculty') ||
                          lowerMessage.includes('timetable') || 
                          lowerMessage.includes('schedule') || 
                          lowerMessage.includes('available') ||
                          lowerMessage.includes('department') ||
                          lowerMessage.includes('office') ||
                          lowerMessage.includes('call') || 
                          lowerMessage.includes('video') || 
                          lowerMessage.includes('meet') ||
                          lowerMessage.includes('appointment') || 
                          lowerMessage.includes('book') ||
                          lowerMessage.includes('phone') ||
                          lowerMessage.includes('speak') ||
                          lowerMessage.includes('talk') ||
                          lowerMessage.includes('connect') ||
                          lowerMessage.includes('contact') ||
                          lowerMessage.includes('reach') ||
                          lowerMessage.includes('get in touch') ||
                          lowerMessage.includes('give a call');
    
    // Determine intent - More intelligent intent detection
    let intent = 'general_query';
    if (isStaffRelated) {
      // If staff name is mentioned, prioritize call intent unless it's clearly just an info query
      if (staffNames.length > 0) {
        // Check if it's clearly just an information query
        const infoKeywords = ['what', 'who', 'tell me about', 'information', 'details', 'subject', 'teach', 'department', 'email', 'phone number', 'contact info'];
        const isInfoQuery = infoKeywords.some(keyword => lowerMessage.includes(keyword));
        
        // Check if it's clearly a call/contact request
        const callKeywords = ['call', 'phone', 'speak', 'talk', 'connect', 'contact', 'reach', 'get in touch', 'give a call', 'please call', 'hey call', 'can you call'];
        const isCallRequest = callKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (isInfoQuery && !isCallRequest) {
          intent = 'staff_info_query';
        } else {
          // If staff name is mentioned and it's not clearly just info, offer call
          intent = 'schedule_call';
        }
      } else if (lowerMessage.includes('call') || lowerMessage.includes('video') || lowerMessage.includes('meet') || 
                 lowerMessage.includes('phone') || lowerMessage.includes('speak') || lowerMessage.includes('talk') ||
                 lowerMessage.includes('connect') || lowerMessage.includes('contact') || lowerMessage.includes('reach') ||
                 lowerMessage.includes('get in touch') || lowerMessage.includes('give a call')) {
        intent = 'schedule_call';
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
        intent = 'schedule_appointment';
      } else if (lowerMessage.includes('timetable') || lowerMessage.includes('schedule') || lowerMessage.includes('free') || lowerMessage.includes('busy')) {
        intent = 'timetable_query';
      } else if (lowerMessage.includes('available') || lowerMessage.includes('when') || lowerMessage.includes('time')) {
        intent = 'availability_query';
      } else {
        intent = 'staff_info_query';
      }
    } else {
      // General knowledge or non-staff related query
      if (lowerMessage.includes('what is') || lowerMessage.includes('how to') || lowerMessage.includes('explain') || 
          lowerMessage.includes('define') || lowerMessage.includes('tell me about') || lowerMessage.includes('why')) {
        intent = 'general_knowledge';
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('good morning') || 
                 lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
        intent = 'greeting';
      } else {
        intent = 'general_query';
      }
    }

    return {
      originalMessage: message,
      lowerMessage: lowerMessage,
      staffNames: staffNames,
      intent: intent,
      identifiedStaff: staffNames.length > 0 ? staffNames[0] : null,
      isStaffRelated: isStaffRelated
    };
  }

  /**
   * Extract staff names from message using fuzzy matching
   */
  async extractStaffNames(message) {
    try {
      // Get all staff members from both database and profiles
      const dbStaff = await this.getAllStaff();
      const allStaff = [...dbStaff, ...staffProfiles];
      
      const identifiedStaff = [];
      
      // Special handling for common name patterns
      const namePatterns = [
        { pattern: /professor\s+bhavya\s*t\.?\s*n\.?/i, name: 'Prof. Bhavya T N' },
        { pattern: /prof\.\s+bhavya\s*t\.?\s*n\.?/i, name: 'Prof. Bhavya T N' },
        { pattern: /dr\.\s+bhavya\s*t\.?\s*n\.?/i, name: 'Prof. Bhavya T N' },
        { pattern: /bhavya\s*t\.?\s*n\.?/i, name: 'Prof. Bhavya T N' },
        { pattern: /bhavya\s+ma'?am/i, name: 'Prof. Bhavya T N' },
        { pattern: /professor\s+lakshmi\s+durga\s*n/i, name: 'Prof. Lakshmi Durga N' },
        { pattern: /prof\.\s+lakshmi\s+durga\s*n/i, name: 'Prof. Lakshmi Durga N' },
        { pattern: /lakshmi\s+durga\s*n/i, name: 'Prof. Lakshmi Durga N' },
        { pattern: /ldn/i, name: 'Prof. Lakshmi Durga N' },
        { pattern: /professor\s+anitha\s*c\.?\s*s\.?/i, name: 'Prof. Anitha C S' },
        { pattern: /prof\.\s+anitha\s*c\.?\s*s\.?/i, name: 'Prof. Anitha C S' },
        { pattern: /anitha\s*c\.?\s*s\.?/i, name: 'Prof. Anitha C S' },
        { pattern: /anitha\s+ma'?am/i, name: 'Prof. Anitha C S' },
        { pattern: /anita\s+ma'?am/i, name: 'Prof. Anitha C S' },
        { pattern: /anita\s*mam/i, name: 'Prof. Anitha C S' },
        { pattern: /acs/i, name: 'Prof. Anitha C S' },
        { pattern: /dr\.\s+g\s*dhivyasri/i, name: 'Dr. G Dhivyasri' },
        { pattern: /g\s*dhivyasri/i, name: 'Dr. G Dhivyasri' },
        { pattern: /gd/i, name: 'Dr. G Dhivyasri' },
        { pattern: /professor\s+nisha\s*s\.?\s*k\.?/i, name: 'Prof. Nisha S K' },
        { pattern: /prof\.\s+nisha\s*s\.?\s*k\.?/i, name: 'Prof. Nisha S K' },
        { pattern: /nisha\s*s\.?\s*k\.?/i, name: 'Prof. Nisha S K' },
        { pattern: /nsk/i, name: 'Prof. Nisha S K' }
      ];
      
      // Check for pattern matches first
      for (const pattern of namePatterns) {
        if (pattern.pattern.test(message)) {
          const staff = allStaff.find(s => s.name === pattern.name);
          if (staff && !identifiedStaff.some(s => s.name === staff.name)) {
            identifiedStaff.push(staff);
          }
        }
      }
      
      for (const staff of allStaff) {
        const staffName = staff.name.toLowerCase();
        const staffNameParts = staffName.split(' ');
        const shortName = staff.shortName ? staff.shortName.toLowerCase() : '';
        
        // Check for exact name matches
        if (message.includes(staffName)) {
          identifiedStaff.push(staff);
          continue;
        }
        
        // Check for short name matches
        if (shortName && message.includes(shortName)) {
          identifiedStaff.push(staff);
          continue;
        }
        
        // Check for partial name matches (more flexible)
        for (const part of staffNameParts) {
          if (part.length > 2 && message.includes(part)) {
            identifiedStaff.push(staff);
            break;
          }
        }
        
        // Check for common name variations (like "Bhavya Ma'am")
        const firstName = staffNameParts[staffNameParts.length - 1]; // Last part is usually first name
        if (firstName && firstName.length > 2) {
          // Check for "FirstName Ma'am" or "FirstName Sir" patterns
          const honorificPatterns = [
            `${firstName} ma'am`,
            `${firstName} sir`,
            `${firstName} mam`,
            `${firstName} madam`,
            `${firstName} miss`,
            `${firstName} miss.`,
            `${firstName} mr.`,
            `${firstName} mrs.`,
            `${firstName} ms.`
          ];
          
          for (const pattern of honorificPatterns) {
            if (message.includes(pattern)) {
              identifiedStaff.push(staff);
              break;
            }
          }
          
          // Check for "Professor FirstName" or "Dr. FirstName" patterns
          const titleFirstNamePatterns = [
            `professor ${firstName}`,
            `prof. ${firstName}`,
            `dr. ${firstName}`,
            `professor ${firstName}.`,
            `prof. ${firstName}.`,
            `dr. ${firstName}.`
          ];
          
          for (const pattern of titleFirstNamePatterns) {
            if (message.includes(pattern)) {
              identifiedStaff.push(staff);
              break;
            }
          }
          
          // Also check for just the first name if it's distinctive
          if (message.includes(firstName) && firstName.length > 3) {
            // Only add if it's not already added and the name is distinctive enough
            const isAlreadyAdded = identifiedStaff.some(s => s._id === staff._id || s.name === staff.name);
            if (!isAlreadyAdded) {
              identifiedStaff.push(staff);
            }
          }
        }
        
        // Check for title + name combinations
        const titlePatterns = [
          `dr. ${staffName}`,
          `professor ${staffName}`,
          `prof. ${staffName}`,
          `mr. ${staffName}`,
          `mrs. ${staffName}`,
          `ms. ${staffName}`
        ];
        
        for (const pattern of titlePatterns) {
          if (message.includes(pattern)) {
            identifiedStaff.push(staff);
            break;
          }
        }
      }
      
      console.log('🔍 Identified staff:', identifiedStaff.map(s => s.name));
      return identifiedStaff;
    } catch (error) {
      console.error('Error extracting staff names:', error);
      return [];
    }
  }

  /**
   * Get relevant staff data for the query
   */
  async getRelevantStaffData(analysis) {
    const staffData = {};
    
    for (const staff of analysis.staffNames) {
      try {
        // Get staff timetable
        const timetable = await this.getStaffTimetable(staff._id);
        
        // Get current availability
        const availability = await this.getStaffAvailability(staff, timetable);
        
        staffData[staff._id] = {
          staff: staff,
          timetable: timetable,
          availability: availability
        };
      } catch (error) {
        console.error(`Error getting data for staff ${staff.name}:`, error);
      }
    }
    
    return staffData;
  }

  /**
   * Generate intelligent response using Gemini AI with staff context
   */
  async generateIntelligentResponse(message, analysis, staffData) {
    try {
      // If this is a call request, don't use Gemini - use direct response
      if (analysis.intent === 'schedule_call' && analysis.staffNames.length > 0) {
        const staff = analysis.staffNames[0];
        // Standardized phrase so downstream can reliably trigger a targeted video call
        return `I am going to start a video call with ${staff.name}. Please hold while I ring them.`;
      }
      
      // Build context for Gemini AI
      const context = this.buildGeminiContext(analysis, staffData);
      
      // Simplified prompt for Clara to reduce token usage
      let enhancedPrompt = `You are Clara, a friendly AI receptionist at Sai Vidya Institute of Technology. Answer this question naturally and helpfully: "${message}"

${context}

Respond as Clara would - warmly and professionally. Don't mention being an AI model.`;

      // Get response from Gemini AI
      const response = await queryGemini(enhancedPrompt, []);
      
      return response;
    } catch (error) {
      console.error('Error generating response with Gemini:', error);
      
      // Fallback response
      return this.generateFallbackResponse(analysis, staffData);
    }
  }

  /**
   * Build context for Gemini AI
   */
  buildGeminiContext(analysis, staffData) {
    let context = "";
    
    // Add key staff information (simplified to reduce tokens)
    context += "Staff Directory: ";
    staffProfiles.forEach(staff => {
      context += `${staff.name}(${staff.shortName}) - ${staff.subjects.join(', ')}; `;
    });
    
    if (analysis.isStaffRelated && analysis.staffNames.length > 0) {
      context += "\nRequested staff: ";
      for (const staff of analysis.staffNames) {
        const data = staffData[staff._id];
        if (data) {
          context += `${staff.name} - Status: ${data.availability.status}; `;
          if (data.availability.todaySchedule.length > 0) {
            context += "Today: ";
            data.availability.todaySchedule.forEach(entry => {
              context += `${entry.timeSlot.start}-${entry.timeSlot.end}: ${entry.activity}; `;
            });
          }
        }
      }
    }
    
    context += "\nInstitute: Sai Vidya Institute of Technology, Computer Science Engineering, Bangalore. Hours: Mon-Sat 9AM-5PM.";
    
    return context;
  }

  /**
   * Generate fallback response when Gemini AI fails
   */
  generateFallbackResponse(analysis, staffData) {
    if (analysis.isStaffRelated && analysis.staffNames.length > 0) {
      const staff = analysis.staffNames[0];
      const data = staffData[staff._id];
      
      if (data) {
        return `I can see you're asking about ${staff.name} (${staff.department}). ${staff.name} is currently ${data.availability.status.toLowerCase()}. Would you like to know more about their schedule or arrange a meeting?`;
      }
    }
    
    if (analysis.intent === 'greeting') {
      return "Hello! I'm Clara, your AI receptionist at Sai Vidya Institute of Technology. I'm here to help you with any questions you might have - whether about our institute, staff, or general knowledge topics. How can I assist you today?";
    }
    
    if (analysis.intent === 'general_knowledge') {
      return "I'd be happy to help you with that question! I'm designed to provide accurate information on a wide range of topics. However, I'm experiencing some technical difficulties right now. Please try asking again in a moment, and I'll do my best to give you a comprehensive answer.";
    }
    
    return "I'm here to help you with information about our staff members, their schedules, arranging meetings, and answering general knowledge questions. How can I assist you today?";
  }

  /**
   * Generate call offer when user wants to schedule a call
   */
  async generateCallOffer(staff, analysis) {
    const data = await this.getStaffAvailability(staff);
    
    if (!data.canAcceptCall) {
      return {
        canCall: false,
        reason: data.status,
        alternative: `Would you like to schedule an appointment instead? ${staff.name} is available for in-person meetings.`
      };
    }
    
    // More natural and proactive call offer message
    let message = `I can see you mentioned ${staff.name}. `;
    
    // Add staff info if available
    if (staff.subjects && staff.subjects.length > 0) {
      message += `${staff.name} teaches ${staff.subjects.join(', ')}. `;
    }
    
    message += `Would you like me to connect you with ${staff.name} via video call right now? They are currently available.`;
    
    return {
      canCall: true,
      staff: {
        id: staff._id,
        name: staff.name,
        department: staff.department,
        designation: staff.designation
      },
      message: message,
      purpose: analysis.originalMessage
    };
  }

  /**
   * Get all staff members
   */
  async getAllStaff() {
    try {
      const cacheKey = 'all_staff';
      const cached = this.staffCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.data;
      }
      
      const staff = await Staff.find({ isActive: true }).select('name department designation office phone');
      
      this.staffCache.set(cacheKey, {
        data: staff,
        timestamp: Date.now()
      });
      
      return staff;
    } catch (error) {
      console.error('Error getting all staff:', error);
      return [];
    }
  }

  /**
   * Get staff timetable
   */
  async getStaffTimetable(staffId) {
    try {
      const cacheKey = `timetable_${staffId}`;
      const cached = this.timetableCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.data;
      }
      
      const timetable = await StaffTimetable.findOne({ 
        staffId: staffId, 
        isActive: true 
      }).populate('staffId', 'name department');
      
      this.timetableCache.set(cacheKey, {
        data: timetable,
        timestamp: Date.now()
      });
      
      return timetable;
    } catch (error) {
      console.error('Error getting staff timetable:', error);
      return null;
    }
  }

  /**
   * Get staff availability
   */
  async getStaffAvailability(staff, timetable = null) {
    try {
      if (!timetable) {
        timetable = await this.getStaffTimetable(staff._id);
      }
      
      const now = new Date();
      const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      let todaySchedule = [];
      let currentStatus = 'Unknown';
      let canAcceptCall = false;
      
      if (timetable) {
        todaySchedule = timetable.getTodaySchedule();
        
        // Find current activity
        const currentEntry = todaySchedule.find(entry => 
          entry.timeSlot.start <= currentTime && entry.timeSlot.end > currentTime
        );
        
        if (currentEntry) {
          currentStatus = currentEntry.activity;
          canAcceptCall = currentEntry.activity === 'Free' || currentEntry.activity === 'Office Hours';
        } else {
          currentStatus = 'Free';
          canAcceptCall = true;
        }
      }
      
      // Check if staff is online and available for calls
      if (!staff.isOnline || !staff.isAvailableForCalls) {
        canAcceptCall = false;
        currentStatus = staff.isOnline ? 'Not accepting calls' : 'Offline';
      }
      
      return {
        status: currentStatus,
        canAcceptCall: canAcceptCall,
        todaySchedule: todaySchedule,
        currentDay: currentDay,
        currentTime: currentTime
      };
    } catch (error) {
      console.error('Error getting staff availability:', error);
      return {
        status: 'Unknown',
        canAcceptCall: false,
        todaySchedule: [],
        currentDay: 'Unknown',
        currentTime: 'Unknown'
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.staffCache.clear();
    this.timetableCache.clear();
  }
}

module.exports = ClaraAI;
