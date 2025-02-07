import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

export class BedrockDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    bedrock.FoundationModel.fromFoundationModelId(
      this,
      'Model',
      bedrock.FoundationModelIdentifier.META_LLAMA_3_1_405_INSTRUCT_V1,
    );

    const lambdaFunction = new lambda.Function(this, 'BedrockDemoFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('../lambda'),
      handler: 'index.handler',
      timeout: Duration.seconds(3000),
    });
  }
}
