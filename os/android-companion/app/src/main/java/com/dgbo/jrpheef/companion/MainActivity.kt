package com.dgbo.jrpheef.companion

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.dgbo.jrpheef.companion.BuildConfig

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CompanionHome(onOpen = ::openJrPheef)
                }
            }
        }
    }

    private fun openJrPheef() {
        val uri = Uri.parse(BuildConfig.JR_BASE_URL)
        startActivity(Intent(Intent.ACTION_VIEW, uri))
    }
}

@Composable
private fun CompanionHome(onOpen: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "JR PHEEF", style = MaterialTheme.typography.headlineLarge)
        Spacer(modifier = Modifier.height(12.dp))
        Text(text = "Your connected digital environment")
        Spacer(modifier = Modifier.height(28.dp))
        Button(onClick = onOpen) {
            Text("Open JR PHEEF")
        }
        Spacer(modifier = Modifier.height(18.dp))
        Text(
            text = "Companion preview · More device capabilities will arrive through verified updates.",
            style = MaterialTheme.typography.bodySmall
        )
    }
}
