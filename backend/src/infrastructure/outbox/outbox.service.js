const OutBox =
    require("../../models/OutBox");


const createOutboxEvent = async ({
    session,
    eventType,
    aggregateType,
    aggregateId,
    payload,
}) => {

    if (!session) {
        throw new Error(
            "Outbox event requires an active transaction"
        );
    }

    if (!eventType) {
        throw new Error(
            "eventType is required"
        );
    }

    if (!aggregateType) {
        throw new Error(
            "aggregateType is required"
        );
    }

    if (!aggregateId) {
        throw new Error(
            "aggregateId is required"
        );
    }

    if (payload === undefined) {
        throw new Error(
            "payload is required"
        );
    }


    const [event] = await OutBox.create(
        [
            {
                eventType,

                aggregateType,

                aggregateId:
                    aggregateId.toString(),

                payload,

                status: "PENDING",

                availableAt: new Date(),
            },
        ],
        {
            session,
        }
    );


    return event;
};


module.exports = createOutboxEvent;