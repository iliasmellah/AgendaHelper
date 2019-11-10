// Lambda Function code for Alexa.

const Alexa = require("ask-sdk");
const https = require("https");
const invocationName = "agenda";

// URL of schedule and weather APIs to get data and requires Helper
const urlSchedule = 'https://wave-it.fr/application/cache/json/IG5.json';
const urlWeather = 'https://api.weatherbit.io/v2.0/forecast/daily?city=Montpellier&country=FR&key=1581a3631c2942319e24e5d56d627b9b'
const Helper = require('./Helper.js')

// Gets schedule of IG students
function getSchedule() {
  return new Promise(((resolve, reject) => {

    const request = https.request(urlSchedule, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(Helper.prepareSchedule(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    
    request.on('error', function (error) {
      reject(error);
    });
    
    request.end();
  }));
}

//Gets weather
function getWeather() {
    return new Promise(((resolve, reject) => {

    const request = https.request(urlWeather, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(returnData);
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    
    request.on('error', function (error) {
      reject(error);
    });
    
    request.end();
  }));
}

// Session Attributes 
//   Alexa will track attributes for you, by default only during the lifespan of your session.
//   The history[] array will track previous request(s), used for contextual Help/Yes/No handling.
//   Set up DynamoDB persistence to have the skill save and reload these attributes between skill sessions.

function getMemoryAttributes() {   const memoryAttributes = {
       "history":[],

        // The remaining attributes will be useful after DynamoDB persistence is configured
       "launchCount":0,
       "lastUseTimestamp":0,

       "lastSpeechOutput":{},
       "nextIntent":[]

       // "favoriteColor":"",
       // "name":"",
       // "namePronounce":"",
       // "email":"",
       // "mobileNumber":"",
       // "city":"",
       // "state":"",
       // "postcode":"",
       // "birthday":"",
       // "bookmark":0,
       // "wishlist":[],
   };
   return memoryAttributes;
};

const maxHistorySize = 20; // remember only latest 20 intents 

// 1. Intent Handlers =============================================

const AMAZON_FallbackIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let previousSpeech = getPreviousSpeechOutput(sessionAttributes);

        return responseBuilder
            .speak('Sorry I didnt catch what you said, ' + stripSpeak(previousSpeech.outputSpeech))
            .reprompt(stripSpeak(previousSpeech.reprompt))
            .getResponse();
    },
};

const AMAZON_CancelIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Okay, talk to you later! ';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const AMAZON_HelpIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let intents = getCustomIntents();
        let sampleIntent = randomElement(intents);

        let say = 'You asked for help. '; 

        // let previousIntent = getPreviousIntent(sessionAttributes);
        // if (previousIntent && !handlerInput.requestEnvelope.session.new) {
        //     say += 'Your last intent was ' + previousIntent + '. ';
        // }
        // say +=  'I understand  ' + intents.length + ' intents, '

        say += ' Here something you can ask me, ' + getSampleUtterance(sampleIntent);

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

const AMAZON_StopIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Okay, talk to you later! ';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const AMAZON_NavigateHomeIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hello from AMAZON.NavigateHomeIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

// Intent called when school day start time is asked
const GetStartTime_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetStartTime' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let slotStatus = '';
        let slotValues = getSlotValues(request.intent.slots);

        if( (slotValues.day.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.day.heardAs) ) {
            slotStatus += 'Slot day is empty or not matching. ';
            slotStatus += 'A few valid values are : ' + sayArray(getExampleSlotValues('GetStartTime','day'), 'or') + '. Please try again. ';
        }
        
        return new Promise((resolve, reject) => {
            getSchedule().then((response) => {
                let heardWord = slotValues.day.heardAs
                let dayOfWeek = Helper.getDayOfWeek()
                if(heardWord == "today") {
                    if (dayOfWeek == 6 || dayOfWeek == 7) {
                        slotStatus = 'No class today ! Your next course will be on the '
                        + Helper.dateToNum(response[0].date) + ' at '
                        + response[0].start_time + ". "
                    } else {
                        slotStatus = capitalize(heardWord) + ", you start at " + response[0].start_time + ". "
                    }
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                } else if(heardWord == "tomorrow") {
                    let tD = Helper.getTomorrowDate() // tD : tomorrowDate
                    let tomorrowInfo = Helper.getInfoByDate(response, tD.year, tD.month, tD.day)
                    if (dayOfWeek == 5 || dayOfWeek == 6) {
                        slotStatus = 'No class tomorrow ! Your next course will be on the ' 
                        + Helper.dateToNum(response[0].date) + ' at '
                        + response[0].start_time + ". "
                    } else {
                        slotStatus = capitalize(heardWord) + ", you will start at " + tomorrowInfo[0].start_time + ". "
                    }
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                } else {
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                }
            
            }).catch((error) => {
                resolve(
                    responseBuilder
                        .speak(slotStatus)
                        .reprompt('try again')
                        .getResponse());
            });
        });            
    },
};

// Intent called when school day end time is asked
const GetEndTime_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetEndTime' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let slotStatus = '';
        let slotValues = getSlotValues(request.intent.slots);

        if( (slotValues.day.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.day.heardAs) ) {
            slotStatus += 'Slot day is empty or not matching. ';
            slotStatus += 'A few valid values are : ' + sayArray(getExampleSlotValues('GetEndTime','day'), 'or') + '. Please try again. ';
        }
        
        return new Promise((resolve, reject) => {
            getSchedule().then((response) => {
                let heardWord = slotValues.day.heardAs
                let dayOfWeek = Helper.getDayOfWeek()
                let aD = Helper.getInfoByDate(response, response[0].year, response[0].month, response[0].date)
                if(heardWord == "today") {
                    if (dayOfWeek == 6 || dayOfWeek == 7) {
                        slotStatus = 'No class today ! Your next course will be on the '
                        + Helper.dateToNum(response[0].date) + ' at '
                        + response[0].start_time + ". "
                    } else {
                        slotStatus = capitalize(heardWord) + ", you will finish at " + aD[aD.length-1].end_time + ". "
                    }
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                } else if(heardWord == "tomorrow") {
                    let tD = Helper.getTomorrowDate() // tD : tomorrowDate
                    let tomorrowInfo = Helper.getInfoByDate(response, tD.year, tD.month, tD.day)
                    if (dayOfWeek == 5 || dayOfWeek == 6) {
                        slotStatus = 'No class tomorrow ! Your next course will be on the ' 
                        + Helper.dateToNum(response[0].date) + ' at '
                        + response[0].start_time + ". "
                    } else {
                        slotStatus = capitalize(heardWord) + ", you will finish at " 
                        + tomorrowInfo[tomorrowInfo.length-1].end_time + ". "
                    }
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                } else {
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                }
            
            }).catch((error) => {
                resolve(
                    responseBuilder
                        .speak(slotStatus)
                        .reprompt('try again')
                        .getResponse());
            });
        });     
    },
};

// Intent called when next vacation is asked
const GetNextHolidays_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetNextHolidays' ;
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;
        let slotStatus = '';
        
        return new Promise((resolve, reject) => {
            getSchedule().then((response) => {
                let vac = Helper.getNextVac(response)
                slotStatus = "Your next vacation is on " + Helper.monthToString(vac.month-1)
                + ", the " + Helper.dateToNum(vac.date) + ". "
                resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
            
            }).catch((error) => {
                resolve(
                    responseBuilder
                        .speak(slotStatus)
                        .reprompt('try again')
                        .getResponse());
            });
        });     
    },
};

// Intent called when next exam is asked
const GetNextExam_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetNextExam' ;
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;
        let slotStatus = '';
        
        return new Promise((resolve, reject) => {
            getSchedule().then((response) => {
                let exam = Helper.getNextExam(response)
                slotStatus = "Your next exam is on " + Helper.monthToString(exam.month-1)
                + ", the " + Helper.dateToNum(exam.date) + ", and it is : " + exam.name
                resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
            
            }).catch((error) => {
                resolve(
                    responseBuilder
                        .speak(slotStatus)
                        .reprompt('try again')
                        .getResponse());
            });
        });   
    },
};

// Intent called when weather is asked
const GetWeather_Hanlder = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetWeather' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let slotStatus = '';
        let slotValues = getSlotValues(request.intent.slots);

        if( (slotValues.day.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.day.heardAs) ) {
            slotStatus += 'Slot day is empty or not matching. ';
            slotStatus += 'A few valid values are : ' + sayArray(getExampleSlotValues('GetWeather','day'), 'or') + '. Please try again. ';
        }
        
        return new Promise((resolve, reject) => {
            getWeather().then((response) => {                
                let heardWord = slotValues.day.heardAs
                let weather = JSON.parse(response)
                if(heardWord == "today") {
                    let weatherToday = weather.data[0]
                    slotStatus = capitalize(heardWord) + " in " + weather.city_name 
                        + ", the average temperature will be " + weatherToday.temp 
                        + " and there will be " + weatherToday.weather.description.toLowerCase() + ". "
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                } else if(heardWord == "tomorrow") {
                    let weatherTomorrow = weather.data[1]
                    slotStatus = capitalize(heardWord) + " in " + weather.city_name 
                        + ", the average temperature will be " + weatherTomorrow.temp 
                        + " and there will be " + weatherTomorrow.weather.description.toLowerCase() + ". "
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                } else {
                    resolve(
                        responseBuilder
                            .speak(slotStatus)
                            .reprompt('try again, ' + slotStatus)
                            .getResponse());
                }
                
            
            }).catch((error) => {
                resolve(
                    responseBuilder
                        .speak(slotStatus)
                        .reprompt('try again')
                        .getResponse());
            });
        });     
    },
};

// Intent called when Agenda Helper is being opened
const LaunchRequest_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'Hello and welcome to ' + capitalize(invocationName) + ' ! Say help to hear some options.';

        let skillTitle = capitalize(invocationName);

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .withStandardCard('Welcome!', 
              'Hello!\nThis is a card for your skill, ' + skillTitle,
               welcomeCardImg.smallImageUrl, welcomeCardImg.largeImageUrl)
            .getResponse();
    },
};

const SessionEndedHandler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler =  {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Error handled: ${error.message}`);
        // console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);

        return handlerInput.responseBuilder
            .speak('Sorry, an error occurred.  Please say again.')
            .reprompt('Sorry, an error occurred.  Please say again.')
            .getResponse();
    }
};


// 2. Constants ===========================================================================

    // Here you can define static data, to be used elsewhere in your code.  For example: 
    //    const myString = "Hello World";
    //    const myArray  = [ "orange", "grape", "strawberry" ];
    //    const myObject = { "city": "Boston",  "state":"Massachusetts" };

const APP_ID = undefined;  // TODO replace with your Skill ID (OPTIONAL).

// 3.  Helper Functions ===================================================================

function capitalize(myString) {
     return myString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }) ;
}
 
function randomElement(myArray) { 
    return(myArray[Math.floor(Math.random() * myArray.length)]); 
} 
 
function stripSpeak(str) { 
    return(str.replace('<speak>', '').replace('</speak>', '')); 
} 

function getSlotValues(filledSlots) { 
    const slotValues = {}; 
 
    Object.keys(filledSlots).forEach((item) => { 
        const name  = filledSlots[item].name; 
 
        if (filledSlots[item] && 
            filledSlots[item].resolutions && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0] && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
                case 'ER_SUCCESS_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name, 
                        ERstatus: 'ER_SUCCESS_MATCH' 
                    }; 
                    break; 
                case 'ER_SUCCESS_NO_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: '', 
                        ERstatus: 'ER_SUCCESS_NO_MATCH' 
                    }; 
                    break; 
                default: 
                    break; 
            } 
        } else { 
            slotValues[name] = { 
                heardAs: filledSlots[item].value, 
                resolved: '', 
                ERstatus: '' 
            }; 
        } 
    }, this); 
 
    return slotValues; 
} 
 
function getExampleSlotValues(intentName, slotName) { 
 
    let examples = []; 
    let slotType = ''; 
    let slotValuesFull = []; 
 
    let intents = model.interactionModel.languageModel.intents; 
    for (let i = 0; i < intents.length; i++) { 
        if (intents[i].name == intentName) { 
            let slots = intents[i].slots; 
            for (let j = 0; j < slots.length; j++) { 
                if (slots[j].name === slotName) { 
                    slotType = slots[j].type; 
 
                } 
            } 
        } 
         
    } 
    let types = model.interactionModel.languageModel.types; 
    for (let i = 0; i < types.length; i++) { 
        if (types[i].name === slotType) { 
            slotValuesFull = types[i].values; 
        } 
    } 
 
 
    examples.push(slotValuesFull[0].name.value); 
    examples.push(slotValuesFull[1].name.value); 
    if (slotValuesFull.length > 2) { 
        examples.push(slotValuesFull[2].name.value); 
    } 
 
 
    return examples; 
} 
 
function sayArray(myData, penultimateWord = 'and') { 
    let result = ''; 
 
    myData.forEach(function(element, index, arr) { 
 
        if (index === 0) { 
            result = element; 
        } else if (index === myData.length - 1) { 
            result += ` ${penultimateWord} ${element}`; 
        } else { 
            result += `, ${element}`; 
        } 
    }); 
    return result; 
} 
 
const welcomeCardImg = { 
    smallImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png", 
    largeImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png" 
}; 
 
const DisplayImg1 = { 
    title: 'Jet Plane', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/plane340_340.png' 
}; 
const DisplayImg2 = { 
    title: 'Starry Sky', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/background1024_600.png' 
}; 
 
function getCustomIntents() { 
    const modelIntents = model.interactionModel.languageModel.intents; 
    let customIntents = []; 
    for (let i = 0; i < modelIntents.length; i++) { 
        if(modelIntents[i].name.substring(0,7) != "AMAZON." && modelIntents[i].name !== "LaunchRequest" ) { 
            customIntents.push(modelIntents[i]); 
        } 
    } 
    return customIntents; 
} 
 
function getSampleUtterance(intent) { 
 
    return randomElement(intent.samples); 
 
}
 
function getPreviousSpeechOutput(attrs) { 
    if (attrs.lastSpeechOutput && attrs.history.length > 1) { 
        return attrs.lastSpeechOutput;
    } else { 
        return false; 
    } 
} 
 
const InitMemoryAttributesInterceptor = { 
    process(handlerInput) { 
        let sessionAttributes = {}; 
        if(handlerInput.requestEnvelope.session['new']) { 
            sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
            let memoryAttributes = getMemoryAttributes(); 
            if(Object.keys(sessionAttributes).length === 0) { 
                Object.keys(memoryAttributes).forEach(function(key) {  // initialize all attributes from global list 
                    sessionAttributes[key] = memoryAttributes[key]; 
                }); 
            } 
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
        } 
    } 
}; 
 
const RequestHistoryInterceptor = { 
    process(handlerInput) { 
        const thisRequest = handlerInput.requestEnvelope.request; 
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
        let history = sessionAttributes['history'] || []; 
        let IntentRequest = {}; 
        if (thisRequest.type === 'IntentRequest' ) { 
            let slots = []; 
            IntentRequest = { 
                'IntentRequest' : thisRequest.intent.name 
            }; 
            if (thisRequest.intent.slots) { 
                for (let slot in thisRequest.intent.slots) { 
                    let slotObj = {}; 
                    slotObj[slot] = thisRequest.intent.slots[slot].value; 
                    slots.push(slotObj); 
                } 
                IntentRequest = { 
                    'IntentRequest' : thisRequest.intent.name, 
                    'slots' : slots 
                }; 
            } 
        } else { 
            IntentRequest = {'IntentRequest' : thisRequest.type}; 
        } 
        if(history.length > maxHistorySize - 1) { 
            history.shift(); 
        } 
        history.push(IntentRequest); 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
    } 
}; 
 
// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
    .addRequestHandlers(
        AMAZON_FallbackIntent_Handler, 
        AMAZON_CancelIntent_Handler, 
        AMAZON_HelpIntent_Handler, 
        AMAZON_StopIntent_Handler, 
        AMAZON_NavigateHomeIntent_Handler, 
        GetStartTime_Handler, 
        GetEndTime_Handler,
        GetNextHolidays_Handler, 
        GetNextExam_Handler,
        GetWeather_Hanlder,
        LaunchRequest_Handler, 
        SessionEndedHandler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(InitMemoryAttributesInterceptor)
    .addRequestInterceptors(RequestHistoryInterceptor)

    .lambda();


// End of Skill code -------------------------------------------------------------


// Static Language Model for reference - Alexa Dev Console

const model = {
  "interactionModel": {
    "languageModel": {
      "invocationName": "agenda",
      "intents": [
        {
          "name": "AMAZON.FallbackIntent",
          "samples": []
        },
        {
          "name": "AMAZON.CancelIntent",
          "samples": []
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": []
        },
        {
          "name": "AMAZON.StopIntent",
          "samples": []
        },
        {
          "name": "AMAZON.NavigateHomeIntent",
          "samples": []
        },
        {
          "name": "GetStartTime",
          "slots": [
            {
              "name": "day",
              "type": "days"
            }
          ],
          "samples": [
            "at what time do i need to be in class {day}",
            "when does school start {day}",
            "when does class start {day}",
            "when do i start school {day}",
            "when do i start {day}"
          ]
        },
        {
          "name": "GetEndTime",
          "slots": [
            {
              "name": "day",
              "type": "days"
            }
          ],
          "samples": [
            "when will i be free {day}",
            "when do i leave school {day}",
            "when does school end {day}",
            "when do i finish school {day}"
          ]
        },
        {
          "name": "GetNextHolidays",
          "slots": [],
          "samples": [
            "when will i be able to rest",
            "when are my next holidays",
            "when are my next vacation"
          ]
        },
        {
          "name": "GetNextExam",
          "slots": [],
          "samples": [
            "which course do i need to study",
            "what do i need to study",
            "what is my next exam",
            "when is my next exam"
          ]
        },
        {
            "name": "GetWeather",
            "slots": [
                {
                    "name": "day",
                    "type": "days"
                }
            ],
            "samples": [
                "how will be the weather like {day}",
                "what will be the weather like {day}"
            ]
        },
        {
          "name": "LaunchRequest"
        }
      ],
      "types": [
        {
          "name": "days",
          "values": [
            {
              "name": {
                "value": "tomorrow"
              }
            },
            {
              "name": {
                "value": "today"
              }
            }
          ]
        }
      ]
    }
  }
};
