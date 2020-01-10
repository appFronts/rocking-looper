export class Recorder {

    recorder: MediaRecorder;

    constructor(streamDestination: MediaStream) {
       this.recorder = new MediaRecorder(streamDestination);
    }

    startRecording() {
        this.recorder.start();
    }

    stopRecording() {
        this.recorder.stop();
    }

}