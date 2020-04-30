// @flow
import React, { useState } from 'react';
import type { Node } from 'react';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import DeleteIcon from '@material-ui/icons/Delete';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Typography from '@material-ui/core/Typography';
// $FlowFixMe
import * as tf from '@tensorflow/tfjs';

import Canvas from '../../shared/Canvas';
import type { CanvasImages } from '../../shared/Canvas';
import {
  ML_EXPERIMENTS_DEMO_MODELS_PATH,
  ML_EXPERIMENTS_GITHUB_NOTEBOOKS_URL,
} from '../../../constants/links';
import type { Experiment } from '../types';

import labels from './labels';

import cover from '../../../images/sketch_recognition_mlp.png';
import inputImageExample0 from './input-examples/0.png';
import inputImageExample1 from './input-examples/1.png';
import inputImageExample2 from './input-examples/2.png';
import inputImageExample3 from './input-examples/3.png';
import inputImageExample4 from './input-examples/4.png';
import useLayersModel from '../../../hooks/useLayersModel';

const experimentSlug = 'SketchRecognitionMLP';
const experimentName = 'Sketch Recognition (MLP)';
const experimentDescription = 'Hand-written sketch recognition using Multilayer Perceptron (MLP)';
const notebookUrl = `${ML_EXPERIMENTS_GITHUB_NOTEBOOKS_URL}/sketch_recognition_mlp/sketch_recognition_mlp.ipynb`;
const inputImagesExamples = [
  inputImageExample0,
  inputImageExample1,
  inputImageExample2,
  inputImageExample3,
  inputImageExample4,
];

const additionalGuessesNum = 3;

const modelPath = `${ML_EXPERIMENTS_DEMO_MODELS_PATH}/sketch_recognition_mlp/model.json`;

const canvasWidth = 200;
const canvasHeight = 200;

const useStyles = makeStyles(() => ({
  paper: {
    width: canvasWidth,
    height: canvasHeight,
    overflow: 'hidden',
  },
  recognizedDigit: {
    height: '100%',
    fontSize: '10rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

const SketchRecognitionMLP = (): Node => {
  const classes = useStyles();

  const { model, modelErrorMessage } = useLayersModel({
    modelPath,
    warmup: true,
  });
  const [recognizedCategoryIndex, setRecognizedCategoryIndex] = useState(null);
  const [guessIndices, setGuessIndices] = useState(null);
  const [sketchImageData, setSketchImageData] = useState(null);
  const [canvasRevision, setCanvasRevision] = useState(0);

  const onDrawEnd = (canvasImages: CanvasImages) => {
    if (!canvasImages.imageData) {
      return;
    }
    setSketchImageData(canvasImages.imageData);
  };

  const onClearCanvas = () => {
    setRecognizedCategoryIndex(null);
    setGuessIndices(null);
    setSketchImageData(null);
    setCanvasRevision(canvasRevision + 1);
  };

  const onRecognize = () => {
    if (!sketchImageData || !model) {
      return;
    }

    const modelInputWidth = model.layers[0].input.shape[1];
    const modelInputHeight = model.layers[0].input.shape[2];
    const colorsAxis = 2;

    const tensor = tf.browser
      .fromPixels(sketchImageData)
      // Resize image to fit neural network input.
      .resizeNearestNeighbor([modelInputWidth, modelInputHeight])
      // Calculate grey-scale average across channels.
      .mean(colorsAxis)
      // Invert image colors to fit neural network model input.
      .mul(-1)
      .add(255)
      // Normalize.
      .div(255)
      // Reshape.
      .reshape([1, modelInputWidth, modelInputHeight, 1]);

    const prediction = model.predict(tensor);
    const categoryIndex = prediction.argMax(1).dataSync()[0];
    setRecognizedCategoryIndex(categoryIndex);

    const probs = prediction.arraySync()[0];
  };

  if (!model && !modelErrorMessage) {
    return (
      <Box>
        <Box>
          Loading the model
        </Box>
        <LinearProgress />
      </Box>
    );
  }

  const canvasPaper = (
    <>
      <Box mb={1}>
        Draw
        {' '}
        <b>one BIG</b>
        {' '}
        sketch figure here
      </Box>
      <Paper className={classes.paper}>
        <Canvas
          width={canvasWidth}
          height={canvasHeight}
          onDrawEnd={onDrawEnd}
          revision={canvasRevision}
          lineWidth={6}
        />
      </Paper>
    </>
  );

  const recognizedCategory =
    recognizedCategoryIndex !== null && recognizedCategoryIndex < labels.length
      ? labels[recognizedCategoryIndex]
      : null;

  const additionalGuesses = guessIndices ? guessIndices.map((guessIndex) => (
    <Typography variant="h4" component="h4" key={guessIndex}>
      {labels[guessIndex]}
    </Typography>
  )) : null;

  const recognizedCategoryElement = recognizedCategory ? (
    <Box mt={2}>
      <Grid container spacing={2} alignItems="center" justify="flex-start">
        <Grid item>
          It looks like
        </Grid>
        <Grid item>
          <Typography variant="h2" component="h2">
            {recognizedCategory}
          </Typography>
        </Grid>
        <Grid item>
          or
        </Grid>
        <Grid item>
          {additionalGuesses}
        </Grid>
      </Grid>
    </Box>
  ) : null;

  const buttons = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="center"
    >
      <Box mb={1}>
        <Button
          color="primary"
          onClick={onRecognize}
          startIcon={<PlayArrowIcon />}
          disabled={!sketchImageData}
        >
          Recognize
        </Button>
      </Box>

      <Box mb={1}>
        <Button
          color="secondary"
          onClick={onClearCanvas}
          startIcon={<DeleteIcon />}
          disabled={!sketchImageData}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Grid container spacing={3} alignItems="center" justify="flex-start">
        <Grid item>
          {canvasPaper}
        </Grid>

        <Grid item>
          {buttons}
        </Grid>
      </Grid>

      {recognizedCategoryElement}
    </Box>
  );
};

const experiment: Experiment = {
  slug: experimentSlug,
  name: experimentName,
  description: experimentDescription,
  component: SketchRecognitionMLP,
  notebookUrl,
  cover,
  inputImageExamples: {
    images: inputImagesExamples,
    imageWidth: 50,
  },
};

export default experiment;